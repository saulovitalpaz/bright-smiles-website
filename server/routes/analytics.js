const crypto = require('node:crypto');
const net = require('node:net');

const ACCEPTED_EVENT_TYPES = new Set(['pageview', 'blog_view', 'story_view']);
const FINGERPRINT_PATTERN = /^[a-f0-9]{64}$/i;
const GEO_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const GEO_LOOKUP_TIMEOUT_MS = 1500;
const MAX_PATH_LENGTH = 512;
const MAX_SOURCE_LENGTH = 120;
const MAX_USER_AGENT_LENGTH = 512;
const DEFAULT_PRUNE_BATCH_SIZE = 64;
const DEFAULT_RATE_LIMIT_ENTRIES = 4096;
const DEFAULT_GEO_CACHE_ENTRIES = 4096;

const BOT_PATTERN = /(bot|crawler|spider|slurp|bingpreview|mediapartners-google|facebookexternalhit|whatsapp|telegrambot|preview|headless|uptime|monitor)/i;
const TABLET_PATTERN = /(ipad|tablet|kindle|playbook|silk|sm-t|tab)/i;
const MOBILE_PATTERN = /(mobile|iphone|ipod|android|blackberry|phone)/i;
const DESKTOP_PATTERN = /(windows|macintosh|linux|x11|cros)/i;

const clampText = (value, maxLength, fallback = '') => {
    if (typeof value !== 'string') return fallback;
    const trimmed = value.trim();
    return (trimmed || fallback).slice(0, maxLength);
};

const normalizeEvent = (body) => {
    const type = typeof body?.type === 'string' ? body.type.trim() : 'pageview';
    const path = typeof body?.path === 'string' ? body.path.trim() : '/';
    const source = typeof body?.source === 'string' ? body.source.trim().slice(0, MAX_SOURCE_LENGTH) : 'Direto';

    if (!ACCEPTED_EVENT_TYPES.has(type) || !path.startsWith('/') || path.length > MAX_PATH_LENGTH) {
        return null;
    }

    return {
        type,
        path,
        source: source || 'Direto'
    };
};

const roundCoordinate = (value) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return null;
    return Math.round(numeric * 100) / 100;
};

const normalizeIp = (value) => {
    if (typeof value !== 'string') return '';

    let normalized = value.trim();
    if (!normalized) return '';

    if (normalized.startsWith('::ffff:')) {
        normalized = normalized.slice(7);
    }

    const zoneSeparator = normalized.indexOf('%');
    if (zoneSeparator >= 0) {
        normalized = normalized.slice(0, zoneSeparator);
    }

    return normalized.toLowerCase();
};

const isIpv4InRange = (ip, first, secondMin, secondMax) => {
    const octets = ip.split('.').map((part) => Number(part));
    return octets.length === 4
        && octets[0] === first
        && octets[1] >= secondMin
        && octets[1] <= secondMax;
};

const isPrivateOrReservedIp = (input) => {
    const ip = normalizeIp(input);
    const version = net.isIP(ip);

    if (version === 4) {
        const octets = ip.split('.').map((part) => Number(part));
        if (octets.length !== 4 || octets.some((part) => Number.isNaN(part) || part < 0 || part > 255)) return true;

        if (octets[0] === 0 || octets[0] === 10 || octets[0] === 127) return true;
        if (octets[0] === 169 && octets[1] === 254) return true;
        if (octets[0] === 192 && octets[1] === 168) return true;
        if (isIpv4InRange(ip, 172, 16, 31)) return true;
        if (isIpv4InRange(ip, 100, 64, 127)) return true;
        if (isIpv4InRange(ip, 198, 18, 19)) return true;
        if (octets[0] === 192 && octets[1] === 0 && octets[2] === 0) return true;
        if (octets[0] === 192 && octets[1] === 0 && octets[2] === 2) return true;
        if (octets[0] === 198 && octets[1] === 51 && octets[2] === 100) return true;
        if (octets[0] === 203 && octets[1] === 0 && octets[2] === 113) return true;
        if (octets[0] >= 224) return true;
        return false;
    }

    if (version === 6) {
        return ip === '::1'
            || ip === '::'
            || ip.startsWith('fc')
            || ip.startsWith('fd')
            || ip.startsWith('fe8')
            || ip.startsWith('fe9')
            || ip.startsWith('fea')
            || ip.startsWith('feb')
            || ip.startsWith('2001:db8')
            || ip.startsWith('64:ff9b:1')
            || ip.startsWith('ff');
    }

    return true;
};

const buildVisitorFingerprint = (secret, ip) => crypto
    .createHmac('sha256', String(secret || ''))
    .update(`analytics-visitor:${normalizeIp(ip)}`)
    .digest('hex');

const isBotUserAgent = (userAgent) => BOT_PATTERN.test(userAgent || '');

const pruneExpiredEntries = (store, currentTime, pruneBatchSize = DEFAULT_PRUNE_BATCH_SIZE) => {
    let removed = 0;

    for (const [key, entry] of store) {
        if (removed >= pruneBatchSize) break;
        if (!entry || entry.expiresAt <= currentTime) {
            store.delete(key);
            removed += 1;
        }
    }

    return removed;
};

const enforceMaxEntries = (store, maxEntries) => {
    while (store.size > maxEntries) {
        const oldestKey = store.keys().next().value;
        if (oldestKey === undefined) break;
        store.delete(oldestKey);
    }
};

const inspectStore = (store) => ({
    size: store.size,
    keys: Array.from(store.keys())
});

const createMemoryRateLimiter = ({
    limit = 60,
    windowMs = 60 * 1000,
    now = () => Date.now(),
    maxEntries = DEFAULT_RATE_LIMIT_ENTRIES,
    pruneBatchSize = DEFAULT_PRUNE_BATCH_SIZE,
    buckets = new Map()
} = {}) => {

    const limiter = {
        consume(key) {
            const currentTime = now();
            pruneExpiredEntries(buckets, currentTime, pruneBatchSize);
            const windowStart = currentTime - (currentTime % windowMs);
            const expiresAt = windowStart + windowMs;
            const existing = buckets.get(key);

            if (!existing || existing.expiresAt <= currentTime) {
                buckets.set(key, { count: 1, expiresAt });
                enforceMaxEntries(buckets, maxEntries);
                return true;
            }

            if (existing.count >= limit) {
                return false;
            }

            existing.count += 1;
            return true;
        }
    };

    limiter.inspect = () => inspectStore(buckets);

    return limiter;
};

const formatLocation = (geoInfo) => {
    if (!geoInfo?.city || !geoInfo?.state || !geoInfo?.country) return null;
    return `${geoInfo.city}, ${geoInfo.state} - ${geoInfo.country}`;
};

const createDefaultGeoLookup = (secret, {
    now = () => Date.now(),
    fetchImpl = fetch,
    cache = new Map(),
    cacheTtlMs = GEO_CACHE_TTL_MS,
    maxEntries = DEFAULT_GEO_CACHE_ENTRIES,
    pruneBatchSize = DEFAULT_PRUNE_BATCH_SIZE
} = {}) => {
    const lookup = async (ip) => {
        const normalizedIp = normalizeIp(ip);
        if (!normalizedIp || isPrivateOrReservedIp(normalizedIp)) return null;

        const fingerprint = buildVisitorFingerprint(secret, normalizedIp);
        const currentTime = now();
        pruneExpiredEntries(cache, currentTime, pruneBatchSize);
        const cached = cache.get(fingerprint);
        if (cached && cached.expiresAt > currentTime) {
            return cached.value;
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), GEO_LOOKUP_TIMEOUT_MS);

        try {
            const response = await fetchImpl(
                `https://ipwho.is/${encodeURIComponent(normalizedIp)}?fields=success,city,region,country,latitude,longitude`,
                {
                    method: 'GET',
                    signal: controller.signal
                }
            );

            if (!response.ok) {
                cache.set(fingerprint, { value: null, expiresAt: currentTime + cacheTtlMs });
                enforceMaxEntries(cache, maxEntries);
                return null;
            }

            const payload = await response.json();
            if (!payload || payload.success !== true) {
                cache.set(fingerprint, { value: null, expiresAt: currentTime + cacheTtlMs });
                enforceMaxEntries(cache, maxEntries);
                return null;
            }

            const geoInfo = {
                city: clampText(payload.city, 120, '') || null,
                state: clampText(payload.region, 120, '') || null,
                country: clampText(payload.country, 120, '') || null,
                latitude: roundCoordinate(payload.latitude),
                longitude: roundCoordinate(payload.longitude)
            };

            if (!geoInfo.city && !geoInfo.state && !geoInfo.country) {
                cache.set(fingerprint, { value: null, expiresAt: currentTime + cacheTtlMs });
                enforceMaxEntries(cache, maxEntries);
                return null;
            }

            cache.set(fingerprint, { value: geoInfo, expiresAt: currentTime + cacheTtlMs });
            enforceMaxEntries(cache, maxEntries);
            return geoInfo;
        } catch {
            cache.set(fingerprint, { value: null, expiresAt: currentTime + cacheTtlMs });
            enforceMaxEntries(cache, maxEntries);
            return null;
        } finally {
            clearTimeout(timeout);
        }
    };

    lookup.inspect = () => inspectStore(cache);

    return lookup;
};

const normalizeStoredFingerprint = (secret, rawValue) => {
    const value = normalizeIp(rawValue);
    if (!value) return null;
    if (FINGERPRINT_PATTERN.test(value)) return value.toLowerCase();
    return buildVisitorFingerprint(secret, value);
};

const detectDevice = (userAgent) => {
    const normalized = typeof userAgent === 'string' ? userAgent : '';

    if (TABLET_PATTERN.test(normalized)) return 'tablet';
    if (MOBILE_PATTERN.test(normalized)) return 'mobile';
    if (DESKTOP_PATTERN.test(normalized)) return 'desktop';
    return 'other';
};

const incrementCount = (bucket, key) => {
    if (!key) return;
    bucket[key] = (bucket[key] || 0) + 1;
};

const parseLegacyLocation = (location) => {
    if (typeof location !== 'string') return { city: null, state: null };

    const [cityPart, regionPart] = location.split(',');
    const city = clampText(cityPart, 120, '') || null;
    const state = clampText(regionPart?.split('-')[0], 120, '') || null;

    return { city, state };
};

function createAnalyticsHandlers({ prisma, secret, geoLookup, rateLimiter }) {
    const lookupGeo = geoLookup || createDefaultGeoLookup(secret);
    const limiter = rateLimiter || createMemoryRateLimiter();

    return {
        async collect(req, res) {
            const event = normalizeEvent(req.body);
            if (!event) {
                return res.status(400).json({ error: 'Invalid analytics event type.' });
            }

            const userAgent = clampText(req.headers?.['user-agent'], MAX_USER_AGENT_LENGTH, '');

            if (isBotUserAgent(userAgent)) {
                return res.status(202).json({ status: 'accepted' });
            }

            const ip = normalizeIp(req.ip);
            const fingerprint = buildVisitorFingerprint(secret, ip);

            if (!limiter.consume(fingerprint)) {
                return res.sendStatus(429);
            }

            let geoInfo = null;
            if (!isPrivateOrReservedIp(ip)) {
                geoInfo = await lookupGeo(ip);
            }

            try {
                await prisma.analyticsEvent.create({
                    data: {
                        type: event.type,
                        path: event.path,
                        source: event.source,
                        ip: fingerprint,
                        userAgent: userAgent || null,
                        location: formatLocation(geoInfo),
                        city: geoInfo?.city || null,
                        state: geoInfo?.state || null,
                        latitude: geoInfo?.latitude ?? null,
                        longitude: geoInfo?.longitude ?? null
                    }
                });
            } catch {
                return res.status(202).json({ status: 'accepted' });
            }

            return res.status(202).json({ status: 'accepted' });
        },

        async stats(_req, res) {
            try {
                const [events, leadsCount] = await Promise.all([
                    prisma.analyticsEvent.findMany({ orderBy: { date: 'desc' } }),
                    prisma.lead.count()
                ]);

                const pageviews = events.filter((event) => event.type === 'pageview');
                const uniqueVisitors = new Set(
                    pageviews
                        .map((event) => normalizeStoredFingerprint(secret, event.ip))
                        .filter(Boolean)
                ).size;

                const sources = {};
                const locations = {};
                const regions = {};
                const topPaths = {};
                const devices = {};

                for (const event of pageviews) {
                    const legacyLocation = parseLegacyLocation(event.location);
                    const city = clampText(event.city, 120, '') || legacyLocation.city;
                    const state = clampText(event.state, 120, '') || legacyLocation.state;

                    incrementCount(sources, clampText(event.source, MAX_SOURCE_LENGTH, 'Direto'));
                    incrementCount(locations, city);
                    incrementCount(regions, state);
                    incrementCount(topPaths, clampText(event.path, MAX_PATH_LENGTH, '/'));
                    incrementCount(devices, detectDevice(event.userAgent));
                }

                return res.json({
                    totalVisits: pageviews.length,
                    uniqueVisitors,
                    leadsCount,
                    conversionRate: uniqueVisitors > 0 ? ((leadsCount / uniqueVisitors) * 100).toFixed(2) : '0.00',
                    sources,
                    locations,
                    regions,
                    topPaths,
                    devices
                });
            } catch (error) {
                return res.status(500).json({ error: error.message });
            }
        }
    };
}

module.exports = {
    createAnalyticsHandlers,
    __private: {
        createMemoryRateLimiter,
        createDefaultGeoLookup
    }
};

const test = require('node:test');
const assert = require('node:assert/strict');

const { createAnalyticsHandlers, __private } = require('../routes/analytics');

const createResponse = () => {
    const response = {
        statusCode: 200,
        body: undefined,
        status(code) {
            this.statusCode = code;
            return this;
        },
        sendStatus(code) {
            this.statusCode = code;
            return this;
        },
        json(payload) {
            this.body = payload;
            return this;
        }
    };

    return response;
};

test('collect rejects invalid event types without persisting analytics data', async () => {
    let createCalls = 0;
    const prisma = {
        analyticsEvent: {
            create: async () => {
                createCalls += 1;
                throw new Error('analyticsEvent.create should not run');
            }
        }
    };
    const handlers = createAnalyticsHandlers({ prisma, secret: 'test-secret' });
    const res = createResponse();

    await handlers.collect({
        body: { type: 'signup', path: '/landing', source: 'Ads' },
        headers: { 'user-agent': 'Mozilla/5.0' },
        ip: '198.51.100.10'
    }, res);

    assert.equal(res.statusCode, 400);
    assert.deepEqual(res.body, { error: 'Invalid analytics event type.' });
    assert.equal(createCalls, 0);
});

test('collect accepts valid events, persists a fingerprint, stores geo fields and never returns the saved event', async () => {
    const createCalls = [];
    const geoLookupCalls = [];
    const prisma = {
        analyticsEvent: {
            create: async ({ data }) => {
                createCalls.push(data);
                return { id: 1, ...data };
            }
        }
    };
    const handlers = createAnalyticsHandlers({
        prisma,
        secret: 'analytics-secret',
        geoLookup: async (ip) => {
            geoLookupCalls.push(ip);
            return {
                city: 'Sao Paulo',
                state: 'SP',
                country: 'Brazil',
                latitude: -23.55,
                longitude: -46.64
            };
        },
        rateLimiter: { consume: () => true }
    });
    const res = createResponse();

    await handlers.collect({
        body: { type: 'pageview', path: '/implants', source: 'Instagram' },
        headers: { 'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)' },
        ip: '8.8.8.8'
    }, res);

    assert.equal(res.statusCode, 202);
    assert.deepEqual(res.body, { status: 'accepted' });
    assert.deepEqual(geoLookupCalls, ['8.8.8.8']);
    assert.equal(createCalls.length, 1);
    assert.match(createCalls[0].ip, /^[a-f0-9]{64}$/);
    assert.notEqual(createCalls[0].ip, '8.8.8.8');
    assert.equal(createCalls[0].city, 'Sao Paulo');
    assert.equal(createCalls[0].state, 'SP');
    assert.equal(createCalls[0].location, 'Sao Paulo, SP - Brazil');
    assert.equal(createCalls[0].path, '/implants');
    assert.equal(createCalls[0].source, 'Instagram');
    assert.ok(!('event' in res.body));
    assert.ok(!('id' in res.body));
});

test('collect returns 429 without persisting when the request is throttled', async () => {
    let createCalls = 0;
    const prisma = {
        analyticsEvent: {
            create: async () => {
                createCalls += 1;
                return { id: 1 };
            }
        }
    };
    const handlers = createAnalyticsHandlers({
        prisma,
        secret: 'analytics-secret',
        geoLookup: async () => {
            throw new Error('geoLookup should not run for throttled requests');
        },
        rateLimiter: { consume: () => false }
    });
    const res = createResponse();

    await handlers.collect({
        body: { type: 'pageview', path: '/implants', source: 'Instagram' },
        headers: { 'user-agent': 'Mozilla/5.0' },
        ip: '8.8.8.8'
    }, res);

    assert.equal(res.statusCode, 429);
    assert.equal(createCalls, 0);
});

test('stats aggregates only pageviews, excludes story events from sources and omits individual event payloads', async () => {
    const prisma = {
        analyticsEvent: {
            findMany: async () => ([
                {
                    type: 'pageview',
                    path: '/',
                    source: 'Direto',
                    location: 'Governador Valadares, MG - Brazil',
                    city: 'Governador Valadares',
                    state: 'MG',
                    latitude: -18.85,
                    longitude: -41.95,
                    ip: '203.0.113.10',
                    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
                },
                {
                    type: 'pageview',
                    path: '/tratamento/clareamento',
                    source: 'Ads',
                    location: 'Ipatinga, MG - Brazil',
                    city: 'Ipatinga',
                    state: 'MG',
                    latitude: -19.47,
                    longitude: -42.54,
                    ip: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
                    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)'
                },
                {
                    type: 'story_view',
                    path: '/stories/sorriso',
                    source: 'Instagram',
                    location: 'Rio de Janeiro, RJ - Brazil',
                    city: 'Rio de Janeiro',
                    state: 'RJ',
                    ip: '198.51.100.99',
                    userAgent: 'Mozilla/5.0 (Linux; Android 14)'
                }
            ])
        },
        lead: {
            count: async () => 1
        }
    };
    const handlers = createAnalyticsHandlers({ prisma, secret: 'stats-secret' });
    const res = createResponse();

    await handlers.stats({}, res);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, {
        totalVisits: 2,
        uniqueVisitors: 2,
        leadsCount: 1,
        conversionRate: '50.00',
        sources: {
            Direto: 1,
            Ads: 1
        },
        locations: {
            'Governador Valadares': 1
        },
        regions: {
            MG: 1
        },
        nearbyRegions: [
            { city: 'Governador Valadares', state: 'MG', latitude: -18.85, longitude: -41.95, distanceKm: 0, count: 1 }
        ],
        topPaths: {
            '/': 1,
            '/tratamento/clareamento': 1
        },
        devices: {
            desktop: 1,
            mobile: 1
        }
    });
    assert.ok(!('recentEvents' in res.body));
    assert.ok(!('events' in res.body));
});

test('stats ranks only public page paths and nearby IP-derived locations within 15 km', async () => {
    const prisma = {
        analyticsEvent: {
            findMany: async () => ([
                { type: 'pageview', path: '/admin?source=menu', source: 'Direto', city: 'Governador Valadares', state: 'MG', latitude: -18.85, longitude: -41.95, ip: 'visitor-admin', userAgent: 'Mozilla/5.0' },
                { type: 'pageview', path: '/tratamentos', source: 'Google', city: 'Ipatinga', state: 'MG', latitude: -19.47, longitude: -42.54, ip: 'visitor-near', userAgent: 'Mozilla/5.0' },
                { type: 'pageview', path: '/', source: 'Direto', city: 'Governador Valadares', state: 'MG', latitude: -18.85, longitude: -41.95, ip: 'visitor-home', userAgent: 'Mozilla/5.0' },
                { type: 'pageview', path: '/tratamento/clareamento', source: 'Ads', city: 'Belo Horizonte', state: 'MG', latitude: -19.92, longitude: -43.94, ip: 'visitor-far', userAgent: 'Mozilla/5.0' }
            ])
        },
        lead: { count: async () => 0 }
    };
    const handlers = createAnalyticsHandlers({ prisma, secret: 'stats-secret' });
    const res = createResponse();

    await handlers.stats({}, res);

    assert.deepEqual(res.body.topPaths, { '/tratamentos': 1, '/': 1, '/tratamento/clareamento': 1 });
    assert.ok(!('/admin' in res.body.topPaths));
    assert.deepEqual(Object.keys(res.body.locations), ['Governador Valadares']);
    assert.deepEqual(res.body.regions, { MG: 1 });
    assert.deepEqual(res.body.nearbyRegions, [
        { city: 'Governador Valadares', state: 'MG', latitude: -18.85, longitude: -41.95, distanceKm: 0, count: 1 }
    ]);
});

test('nearby regions preserve distinct IP location estimates in the same city', async () => {
    const events = [
        { city: 'Governador Valadares', latitude: -18.90, longitude: -41.95 },
        { city: 'Governador Valadares', latitude: -18.85, longitude: -41.95 },
        { city: 'Governador Valadares', latitude: null, longitude: null },
    ].map(location => ({ ...location, type: 'pageview', path: '/', state: 'MG' }));
    const handlers = createAnalyticsHandlers({ prisma: { analyticsEvent: { findMany: async () => events }, lead: { count: async () => 0 } }, secret: 'stats-secret' });
    const res = createResponse();
    await handlers.stats({}, res);
    assert.equal(res.body.nearbyRegions.length, 2);
    assert.deepEqual(res.body.nearbyRegions.map(region => region.latitude), [-18.85, -18.90]);
    assert.deepEqual(res.body.locations, { 'Governador Valadares': 2 });
});

test('memory rate limiter prunes expired buckets before growing indefinitely', () => {
    let nowMs = 0;
    const limiter = __private.createMemoryRateLimiter({
        limit: 1,
        windowMs: 1000,
        now: () => nowMs,
        maxEntries: 2,
        pruneBatchSize: 2
    });

    assert.equal(limiter.consume('visitor-a'), true);
    assert.equal(limiter.consume('visitor-b'), true);
    assert.equal(limiter.inspect().size, 2);

    nowMs = 2000;

    assert.equal(limiter.consume('visitor-c'), true);
    assert.deepEqual(limiter.inspect().keys, ['visitor-c']);
});

test('default geo lookup prunes expired cache entries and reuses bounded storage', async () => {
    let nowMs = 0;
    let fetchCalls = 0;
    const geoLookup = __private.createDefaultGeoLookup('geo-secret', {
        now: () => nowMs,
        maxEntries: 2,
        pruneBatchSize: 2,
        fetchImpl: async () => {
            fetchCalls += 1;
            return {
                ok: true,
                json: async () => ({
                    success: true,
                    city: `City ${fetchCalls}`,
                    region: `Region ${fetchCalls}`,
                    country: 'BR',
                    latitude: -19.9234,
                    longitude: -43.9456
                })
            };
        }
    });

    await geoLookup('8.8.8.8');
    await geoLookup('1.1.1.1');

    assert.equal(geoLookup.inspect().size, 2);

    nowMs = (24 * 60 * 60 * 1000) + 1;

    await geoLookup('9.9.9.9');

    assert.equal(fetchCalls, 3);
    assert.equal(geoLookup.inspect().size, 1);
});

"""Bounded public egress for certificate revocation evidence only."""

import ipaddress
from urllib.parse import urlsplit

import aiohttp

MAX_RESPONSE_BYTES = 8 * 1024 * 1024


def validate_target(url, allowed_hosts):
    parsed = urlsplit(str(url))
    host = (parsed.hostname or '').lower().rstrip('.')
    if (parsed.scheme not in ('http', 'https') or parsed.username or parsed.password
            or host not in allowed_hosts or parsed.port not in (None, 80, 443)):
        raise ValueError('Certificate network target not permitted.')
    try:
        if not ipaddress.ip_address(host).is_global:
            raise ValueError('Private certificate network target not permitted.')
    except ValueError as error:
        if 'not permitted' in str(error):
            raise
    return host


class PublicConnector(aiohttp.TCPConnector):
    async def _resolve_host(self, host, port, traces=None):
        addresses = await super()._resolve_host(host, port, traces=traces)
        if not addresses or any(not ipaddress.ip_address(item['host']).is_global for item in addresses):
            raise ValueError('Non-public certificate network address.')
        return addresses


class BoundedResponse(aiohttp.ClientResponse):
    async def read(self):
        if self._body is None:
            chunks = []
            size = 0
            async for chunk in self.content.iter_chunked(65536):
                size += len(chunk)
                if size > MAX_RESPONSE_BYTES:
                    self.close()
                    raise ValueError('Certificate evidence exceeds size limit.')
                chunks.append(chunk)
            self._body = b''.join(chunks)
        return self._body


def session_for(allowed_hosts):
    trace = aiohttp.TraceConfig()

    async def check_request(_session, _context, parameters):
        validate_target(parameters.url, allowed_hosts)

    async def deny_redirect(_session, _context, _parameters):
        raise ValueError('Certificate network redirects are not permitted.')

    trace.on_request_start.append(check_request)
    trace.on_request_redirect.append(deny_redirect)
    return aiohttp.ClientSession(
        connector=PublicConnector(limit=4, ttl_dns_cache=0),
        timeout=aiohttp.ClientTimeout(total=12, connect=5),
        trace_configs=[trace], response_class=BoundedResponse, trust_env=False,
        auto_decompress=False,
    )

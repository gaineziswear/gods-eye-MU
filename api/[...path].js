/**
 * Production API adapter for Vercel.
 *
 * The application providers are implemented as Connect/Vite middleware. Vite's
 * configureServer hooks do not execute in a static Vercel build, so this
 * catch-all registers the same request/response handlers in a Node function.
 * This intentionally omits developer-local endpoints and persistent streams:
 * key setup writes a local .env file, local receivers are machine-local, and
 * AISStream requires a durable websocket worker rather than a short-lived
 * serverless invocation.
 */
import { localProviderPlugins } from '../server/providers/local.js';

const omitted = new Set(['ais-live-proxy', 'key-setup-endpoint', 'local-receivers-proxy']);
const registrations = [];
const middlewareStack = {
  use(...args) {
    if (args.length === 1 && typeof args[0] === 'function') {
      registrations.push({ prefix: '/', handler: args[0] });
      return this;
    }
    const [prefix, ...handlers] = args;
    if (typeof prefix !== 'string') throw new TypeError('Only named middleware prefixes are supported');
    for (const handler of handlers) {
      if (typeof handler === 'function') registrations.push({ prefix, handler });
    }
    return this;
  },
};

for (const plugin of localProviderPlugins()) {
  if (omitted.has(plugin.name)) continue;
  plugin.configureServer?.({ middlewares: middlewareStack });
}

function matches(pathname, prefix) {
  if (prefix === '/' || prefix === '') return true;
  return pathname === prefix || pathname.startsWith(prefix.endsWith('/') ? prefix : prefix + '/');
}

function sendJson(res, status, body, headers = {}) {
  if (res.writableEnded) return;
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  for (const [key, value] of Object.entries(headers)) res.setHeader(key, value);
  res.end(JSON.stringify(body));
}

function configuredCapabilities() {
  return {
    baseImagery: 'client-side Esri/OSM fallback; requires WebGL in the browser',
    aircraftCredentials: Boolean(process.env.OPENSKY_CLIENT_ID && process.env.OPENSKY_CLIENT_SECRET),
    voice: Boolean(process.env.OPENAI_API_KEY),
    googlePhotorealistic: Boolean(process.env.GOOGLE_MAPS_API_KEY || process.env.CESIUM_ION_TOKEN),
    liveVessels: 'requires a durable AISStream worker; not provided by this serverless adapter',
    nasaFirms: Boolean(process.env.FIRMS_MAP_KEY),
    tomtomTraffic: Boolean(process.env.TOMTOM_API_KEY),
  };
}

export default async function handler(req, res) {
  const parsed = new URL(req.url || '/', 'https://' + (req.headers?.host || 'localhost'));
  const pathname = parsed.pathname;

  if (pathname === '/api/health' || pathname === '/api/health/') {
    return sendJson(res, 200, {
      status: 'ok',
      runtime: 'vercel-node-serverless',
      providerMiddlewareRegistered: registrations.length,
      checkedAt: new Date().toISOString(),
      capabilities: configuredCapabilities(),
      notes: [
        'Optional feeds remain unavailable until their server-side credentials are configured.',
        'Live AISStream vessels require a durable worker and are not falsely reported as connected.',
        'The browser must permit WebGL for the 3D globe to render.',
      ],
    });
  }

  const ip = String(req.headers?.['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown')
    .split(',')[0].trim();
  // Process-local safety valve; provider-level quotas/caches remain authoritative.
  const now = Date.now();
  globalThis.__tsiaroApiRate = globalThis.__tsiaroApiRate || new Map();
  const rateMap = globalThis.__tsiaroApiRate;
  const current = rateMap.get(ip);
  if (!current || now - current.start >= 60_000) rateMap.set(ip, { start: now, count: 1 });
  else if (++current.count > 120) return sendJson(res, 429, { error: 'rate_limit_exceeded' }, { 'Retry-After': '60' });
  if (rateMap.size > 2000) {
    for (const [key, value] of rateMap) if (now - value.start >= 60_000) rateMap.delete(key);
  }

  let index = 0;
  const dispatch = async (error) => {
    if (res.writableEnded) return;
    if (error) return sendJson(res, 500, { error: 'provider_middleware_failed' });
    while (index < registrations.length && !matches(pathname, registrations[index].prefix)) index++;
    if (index >= registrations.length) return sendJson(res, 404, { error: 'unknown_api_route', path: pathname });
    const registration = registrations[index++];
    const prefix = registration.prefix === '/' ? '' : registration.prefix.replace(/\/$/, '');
    const originalUrl = req.url;
    const rest = pathname.slice(prefix.length) || '/';
    req.url = rest + parsed.search;
    let nextCalled = false;
    const next = (err) => {
      if (nextCalled) return;
      nextCalled = true;
      req.url = originalUrl;
      void dispatch(err);
    };
    try {
      const result = registration.handler(req, res, next);
      if (result && typeof result.then === 'function') await result;
      req.url = originalUrl;
      // Most provider handlers terminate the response. If a middleware returned
      // without handling it or calling next, allow the next matching handler.
      if (!res.writableEnded && !nextCalled) await dispatch();
    } catch (err) {
      req.url = originalUrl;
      await dispatch(err);
    }
  };

  try {
    await dispatch();
  } catch {
    sendJson(res, 500, { error: 'api_dispatch_failed' });
  }
}

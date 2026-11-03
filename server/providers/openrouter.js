import { randomUUID } from 'node:crypto';
import { readRequestBody } from './common/request.js';
import { readResponseJsonCapped } from './common/http.js';
import {
  buildEligibleModelRoutes,
  isEligibleZdrEndpoint,
  isPublicSourceHostname,
  parseFreeModelAllowlist,
  parseStructuredJson,
  requiresIndependentReview,
  selectIndependentReviewer,
  validateAnalysis,
  validatePublicClassification,
} from '../../src/ai/openrouterPolicy.js';

const OPENROUTER_BASE = 'https://openrouter.ai/api/v1';
const CATALOG_TTL_MS = 5 * 60 * 1000;
const MAX_REQUEST_BYTES = 48 * 1024;
const MAX_SOURCE_COUNT = 8;
const MAX_TOTAL_EVIDENCE_CHARS = 16000;
const MAX_PROVIDER_RESPONSE_BYTES = 160 * 1024;
const RATE_LIMIT_PER_MINUTE = 5;
let catalogCache = { expiresAt: 0, endpoints: [] };
const requestCounts = new Map();

const TASKS = new Set([
  'public_brief',
  'incident_triage',
  'source_assessment',
  'resilience_assessment',
  'geospatial_context',
]);

class ProviderError extends Error {
  constructor(code, status = 502, retryable = false) {
    super(code);
    this.code = code;
    this.status = status;
    this.retryable = retryable;
  }
}

function sendJson(res, status, payload) {
  if (res.writableEnded) return;
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.end(JSON.stringify(payload));
}

function getIp(req) {
  return String(
    req.headers?.['x-forwarded-for'] ||
      req.headers?.['x-real-ip'] ||
      req.socket?.remoteAddress ||
      'unknown',
  )
    .split(',')[0]
    .trim()
    .slice(0, 80);
}

function withinRateLimit(req) {
  const now = Date.now();
  const ip = getIp(req);
  const current = requestCounts.get(ip);
  if (!current || now - current.startedAt >= 60_000) {
    requestCounts.set(ip, { startedAt: now, count: 1 });
  } else if (++current.count > RATE_LIMIT_PER_MINUTE) {
    return false;
  }
  ...[truncated]
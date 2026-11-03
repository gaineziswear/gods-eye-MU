import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildEligibleModelRoutes,
  isEligibleZdrEndpoint,
  isPublicSourceHostname,
  isZeroCostPricing,
  parseFreeModelAllowlist,
  parseStructuredJson,
  requiresIndependentReview,
  selectIndependentReviewer,
  validateAnalysis,
  validatePublicClassification,
} from './openrouterPolicy.js';

const endpoint = (modelId, providerName, overrides = {}) => ({
  model_id: modelId,
  provider_name: providerName,
  tag: providerName.toLowerCase().replace(/[^a-z0-9_-]/g, '-'),
  status: 0,
  context_length: 32768,
  max_completion_tokens: 4096,
  supported_parameters: ['temperature', 'response_format', 'max_tokens'],
  pricing: { prompt: '0', completion: '0', request: '0' },
  uptime_last_1d: 99.9,
  ...overrides,
});

test('model allowlist accepts exact model IDs only and removes duplicates', () => {
  assert.deepEqual(
    parseFreeModelAllowlist('nvidia/nemotron-free, openai/gpt-4, nvidia/nemotron-free, openrouter/free, openrouter/auto, https://bad'),
    ['nvidia/nemotron-free', 'openai/gpt-4'],
  );
});

test('zero-price qualification checks every published price field', () => {
  assert.equal(isZeroCostPricing({ prompt: '0', completion: '0', request: '0' }), true);
  assert.equal(isZeroCostPricing({ prompt: '0', completion: '0.000001', request: '0' }), false);
  assert.equal(isZeroCostPricing({ prompt: '0', completion: '0', request: '0', cache: '0.01' }), false);
  assert.equal(isZeroCostPricing({ prompt: '0' }), false);
  assert.equal(isZeroCostPricing(null), false);
});

test('an eligible route must be ZDR-listed, healthy, structured and zero-priced', () => {
  const allowlist = ['nvidia/nemotron-free'];
  assert.equal(isEligibleZdrEndpoint(endpoint(allowlist[0], 'NVIDIA'), allowlist), true);
  assert.equal(isEligibleZdrEndpoint(endpoint(allowlist[0], 'NVIDIA', { tag: undefined }), allowlist), false);
  assert.equal(isEligibleZdrEndpoint(endpoint(allowlist[0], 'NVIDIA', { status: 1 }), allowlist), false);
  assert.equal(isEligibleZdrEndpoint(endpoint(allowlist[0], 'NVIDIA', {
    supported_parameters: ['temperature', 'response_format'],
  }), allowlist), false);
  assert.equal(isEligibleZdrEndpoint(endpoint(allowlist[0], 'NVIDIA', {
    pricing: { prompt: '0', completion: '0.1' },
  }), allowlist), false);
  assert.equal(isEligibleZdrEndpoint(endpoint('other/model', 'NVIDIA'), allowlist), false);
});

test('route selection follows the explicit allowlist and never invents an unapproved model', () => {
  const allowlist = ['nvidia/model-a', 'qwen/model-b'];
  const routes = buildEligibleModelRoutes([
    endpoint('qwen/model-b', 'Qwen'),
    endpoint('unlisted/model-c', 'Other'),
    endpoint('nvidia/model-a', 'NVIDIA'),
  ], allowlist);
  assert.deepEqual(routes.map((route) => route.modelId), allowlist);
});

test('independent reviewer must use a different model family and provider', () => {
  const routes = [
    { modelId: 'nvidia/model-a', modelAuthor: 'nvidia', providerName: 'NVIDIA', providerTag: 'nvidia' },
    { modelId: 'nvidia/model-b', modelAuthor: 'nvidia', providerName: 'NVIDIA-2', providerTag: 'nvidia-2' },
    { modelId: 'qwen/model-c', modelAuthor: 'qwen', providerName: 'Alibaba', providerTag: 'alibaba' },
  ];
  assert.equal(selectIndependentReviewer(routes, routes[0]), routes[2]);
  assert.equal(selectIndependentReviewer(routes.slice(0, 2), routes[0]), null);
});

test('only designated critical tasks trigger independent review', () => {
  assert.equal(requiresIndependentReview('public_brief'), false);
  assert.equal(requiresIndependentReview('public_brief', true), true);
  assert.equal(requiresIndependentReview('incident_triage'), true);
  assert.equal(requiresIndependentReview('source_assessment'), true);
  assert.equal(requiresIndependentReview('resilience_assessment'), true);
});

test('external inference accepts public material only and blocks obvious PII or sensitive topics', () => {
  assert.equal(validatePublicClassification('public', 'Public weather bulletin').allowed, true);
  assert.equal(validatePublicClassification('internal', 'Operational notes').allowed, false);
  assert.equal(validatePublicClassification('sensitive', 'Private report').allowed, false);
  assert.equal(validatePublicClassification('public', 'Contact patrick@example.com').allowed, false);
  assert.equal(validatePublicClassification('public', 'A child was injured in an incident').allowed, false);
  assert.equal(validatePublicClassification('public', 'Un enfant a été blessé').allowed, false);
});

test('structured output validation preserves known source IDs and flags invented IDs', () => {
  const fence = String.fromCharCode(96).repeat(3);
  const parsed = parseStructuredJson(fence + 'json\n{"summary_fr":"Résumé vérifiable.","summary_en":"A verifiable summary."}\n' + fence);
  assert.equal(parsed.summary_en, 'A verifiable summary.');
  const result = validateAnalysis({
    summary_fr: 'Résumé basé sur les sources.',
    summary_en: 'Summary based on the sources.',
    facts: [
      { claim: 'A supported claim.', source_ids: ['s1'], evidence_status: 'supported' },
      { claim: 'An invented citation.', source_ids: ['fake'], evidence_status: 'supported' },
    ],
    confidence: 'high',
  }, ['s1']);
  assert.equal(result.facts[0].evidence_status, 'supported');
  assert.equal(result.facts[1].evidence_status, 'unverified');
  assert.deepEqual(result.invalid_source_ids, ['fake']);
  assert.equal(result.source_provenance_valid, false);
});

test('supported claims without a supplied source reference are downgraded and flagged', () => {
  const result = validateAnalysis({
    summary_fr: 'Résumé sans référence.',
    summary_en: 'Summary without a reference.',
    facts: [{ claim: 'An unsupported claim.', source_ids: [], evidence_status: 'supported' }],
  }, []);
  assert.equal(result.facts[0].evidence_status, 'unverified');
  assert.equal(result.source_provenance_valid, false);
});

test('source claims without known source references are never treated as provenance-valid', () => {
  const result = validateAnalysis({
    summary_fr: 'Résumé sans référence.',
    summary_en: 'Summary without a reference.',
    facts: [{ claim: 'An unreferenced claim.', source_ids: [], evidence_status: 'unverified' }],
  }, []);
  assert.equal(result.source_provenance_valid, false);
});

test('analysis validation rejects missing bilingual summaries', () => {
  assert.throws(() => validateAnalysis({ summary_fr: 'Résumé uniquement.' }, []), /Both French and English/);
});

test('source host validation blocks private and reserved IPv4 and IPv6 literals', () => {
  for (const host of ['127.0.0.1', '10.0.0.1', '172.16.0.1', '192.168.1.1', '169.254.1.1', '100.64.0.1', '224.0.0.1']) {
    assert.equal(isPublicSourceHostname(host), false, host);
  }
  for (const host of ['::1', '::', 'fd00::1', 'fe80::1', 'ff02::1', '2001:db8::1', '[::ffff:192.168.1.1]']) {
    assert.equal(isPublicSourceHostname(host), false, host);
  }
  assert.equal(isPublicSourceHostname('2606:4700:4700::1111'), true);
  assert.equal(isPublicSourceHostname('8.8.8.8'), true);
  assert.equal(isPublicSourceHostname('govmu.org'), true);
  assert.equal(isPublicSourceHostname('localhost'), false);
  assert.equal(isPublicSourceHostname('service.internal'), false);
});

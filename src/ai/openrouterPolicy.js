export function parseFreeModelAllowlist(value) {
  const seen = new Set();
  return String(value || '').split(',').map((item) => item.trim())
    .filter((item) => /^[a-z0-9][a-z0-9._-]*\/[a-z0-9][a-z0-9._:-]*$/i.test(item))
    .filter((item) => {
      const key = item.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, 20);
}
export function isZeroCostPricing(pricing) {
  if (!pricing || typeof pricing !== 'object' || Array.isArray(pricing)) return false;
  if (!['prompt', 'completion'].every((key) => Object.prototype.hasOwnProperty.call(pricing, key))) return false;
  const values = Object.values(pricing);
  return values.length > 0 && values.every((value) =>
    (typeof value === 'string' || typeof value === 'number')
    && String(value).trim() !== ''
    && Number.isFinite(Number(value))
    && Number(value) === 0
  );
}
export function isEligibleZdrEndpoint(endpoint, allowlist) {
  return Boolean(endpoint && allowlist.includes(endpoint.model_id)
    && typeof endpoint.provider_name === 'string' && endpoint.provider_name.trim()
    && typeof endpoint.tag === 'string' && endpoint.tag.trim()
    && endpoint.status === 0 && Number(endpoint.context_length) >= 2048
    && Array.isArray(endpoint.supported_parameters)
    && endpoint.supported_parameters.includes('response_format')
    && endpoint.supported_parameters.includes('max_tokens')
    && isZeroCostPricing(endpoint.pricing));
}
export function buildEligibleModelRoutes(endpoints, allowlist) {
  const rows = Array.isArray(endpoints) ? endpoints : [];
  const routes = [];
  for (const modelId of allowlist) {
    const candidates = rows.filter((endpoint) => endpoint.model_id === modelId && isEligibleZdrEndpoint(endpoint, allowlist))
      .sort((a, b) => (Number(b.uptime_last_1d || 0) - Number(a.uptime_last_1d || 0))
        || String(a.provider_name).localeCompare(String(b.provider_name)));
    const endpoint = candidates[0];
    if (endpoint) routes.push({
      modelId, providerName: endpoint.provider_name, providerTag: endpoint.tag,
      contextLength: Number(endpoint.context_length),
      maxCompletionTokens: Number(endpoint.max_completion_tokens || 0),
      pricing: endpoint.pricing,
      uptimeLastDay: Number(endpoint.uptime_last_1d || 0),
      modelAuthor: modelId.split('/')[0].toLowerCase(),
    });
  }
  return routes;
}
export function selectIndependentReviewer(routes, primary) {
  if (!primary) return null;
  return (Array.isArray(routes) ? routes : []).find((candidate) =>
    candidate.modelId !== primary.modelId
    && candidate.modelAuthor !== primary.modelAuthor
    && candidate.providerTag !== primary.providerTag
  ) || null;
}
export function requiresIndependentReview(task, critical = false) {
  return critical === true || ['incident_triage', 'source_assessment', 'resilience_assessment'].includes(task);
}
export function validatePublicClassification(classification, content) {
  if (classification !== 'public') return { allowed: false, reason: 'non_public_data_blocked' };
  const value = String(content || '');
  const patterns = [
    /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
    /\b(?:\+?230[\s-]?)?(?:5\d{7}|[2-4]\d{7})\b/,
    /\b(?:passport number|national identity|national id|identity card|bank account|account number|medical record|patient record)\b/i,
    /\b(?:minor|child|children|rape|sexual assault|suicide|self-harm|murder|homicide|fatality|fatal|death|deceased|injured|injury|diagnosis|medical condition|arrested|suspect|allegation|defamation|national security)\b/i,
  ];
  if (patterns.some((pattern) => pattern.test(value))) return { allowed: false, reason: 'sensitive_or_personal_content_detected' };
  return { allowed: true, reason: null };
}
export function parseStructuredJson(value) {
  const text = String(value || '').trim()
    .replace(/^\x60{3}(?:json)?\s*/i, '')
    .replace(/\s*\x60{3}$/i, '');
  const start = text.indexOf('{'), end = text.lastIndexOf('}');
  if (start < 0 || end <= start) throw new Error('Model response was not a JSON object.');
  const parsed = JSON.parse(text.slice(start, end + 1));
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Model response was not a JSON object.');
  return parsed;
}
function textList(value, max = 12) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item || '').trim().slice(0, 600)).filter(Boolean).slice(0, max);
}
export function validateAnalysis(value, sourceIds) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Analysis payload is not an object.');
  const summaryFr = String(value.summary_fr || '').trim().slice(0, 3000);
  const summaryEn = String(value.summary_en || '').trim().slice(0, 3000);
  if (summaryFr.length < 10 || summaryEn.length < 10) throw new Error('Both French and English summaries are required.');
  const known = new Set(sourceIds), invalidSourceIds = new Set();
  let unreferencedSupportedClaim = false;
  const facts = (Array.isArray(value.facts) ? value.facts : []).slice(0, 20).map((fact) => {
    const claim = String((fact && fact.claim) || '').trim().slice(0, 800);
    const suppliedIds = Array.isArray(fact && fact.source_ids) ? fact.source_ids.map((id) => String(id).trim()).filter(Boolean).slice(0, 8) : [];
    const sourceRefs = suppliedIds.filter((id) => known.has(id));
    for (const id of suppliedIds) if (!known.has(id)) invalidSourceIds.add(id);
    let evidenceStatus = ['supported', 'unverified', 'conflicting'].includes(fact && fact.evidence_status) ? fact.evidence_status : 'unverified';
    if (evidenceStatus === 'supported' && sourceRefs.length === 0) {
      evidenceStatus = 'unverified';
      unreferencedSupportedClaim = true;
    }
    return { claim, source_ids: sourceRefs, evidence_status: evidenceStatus };
  }).filter((fact) => fact.claim);
  const confidence = ['low', 'medium', 'high'].includes(value.confidence) ? value.confidence : 'low';
  return {
    summary_fr: summaryFr, summary_en: summaryEn, facts,
    uncertainties: textList(value.uncertainties), agreements: textList(value.agreements),
    disagreements: textList(value.disagreements), unresolved_questions: textList(value.unresolved_questions),
    risk_flags: textList(value.risk_flags), recommended_checks: textList(value.recommended_checks),
    limitations: textList(value.limitations), confidence,
    invalid_source_ids: [...invalidSourceIds],
    source_provenance_valid: invalidSourceIds.size === 0 && !unreferencedSupportedClaim,
  };
}

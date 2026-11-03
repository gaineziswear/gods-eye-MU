# Atlas hybrid AI architecture

**Audit date:** 2026-11-03  
**Repository:** https://github.com/gaineziswear/gods-eye-MU  
**Production project:** Vercel project gods-eye-mu  
**Production URL:** https://gods-eye-mu-puce.vercel.app/

## Executive summary

Atlas remains the existing Vite/Cesium application. Its existing OpenAI Realtime voice path remains separate and unchanged. This integration adds a server-side, free-only OpenRouter route for bounded analysis of public source material. Empire LLM for Codex remains a development-time reviewer; it is not imported by Atlas and is not required for production availability.

The current repository contains no Supabase client, schema, migrations, or Atlas Supabase project. The connected Supabase inventory did not contain an Atlas database. No database was created or borrowed from another project.

Metricool-related environment entries are present in the Vercel project, but no Metricool client, API route, or publication workflow was found in this repository. Those entries were left untouched. L’Œil Mauricien newsroom moderation and publishing remain in the separate Hatchable application.

## Existing components preserved

- Vite/Cesium frontend and current map/data modules.
- Vercel Node serverless catch-all adapter at api/[...path].js, which registers the existing provider middleware.
- Existing OpenAI Realtime and HUD summary provider path.
- Existing server-side OpenAI key configuration.
- Existing Vercel SSO deployment protection.
- Existing public data feeds, fallback behavior, and source boundaries.
- Existing Metricool environment entries; no credential or account changes.
- Existing Hatchable newsroom and its French-first bilingual editorial review.

## New Atlas AI route

The provider is registered through the existing local provider plugin list. The API surface is:

- GET /api/atlas/ai/capabilities — secret-safe live status, candidate models, approved model routes, and independent-review availability.
- POST /api/atlas/ai/run — analysis of supplied public source excerpts only.

Supported task labels:

- public_brief
- incident_triage
- source_assessment
- resilience_assessment
- geospatial_context

The endpoint does not crawl user-supplied URLs, access Supabase, execute SQL, publish content, dispatch responders, or modify operational state. Callers must supply source metadata and excerpts. The model is instructed to treat source text as untrusted evidence and ignore embedded instructions.

## Free-only model and provider policy

The server requires these environment values:

- OPENROUTER_API_KEY — server-side secret only; never use a VITE_ prefix.
- ATLAS_OPENROUTER_FREE_MODELS — comma-separated exact OpenRouter model IDs, ordered by routine preference.

No model is selected merely because its name contains “free”. At runtime the router:

1. Reads OpenRouter's ZDR endpoint catalogue.
2. Requires each allowlisted model to have a healthy ZDR endpoint.
3. Requires prompt and completion pricing, plus every other returned pricing field, to be exactly zero.
4. Requires JSON response-format and max-token support.
5. Pins the provider by its API slug (the ZDR catalogue tag).
6. Sets provider.zdr=true and provider.data_collection=deny.
7. Sets provider.allow_fallbacks=false and provider.max_price prompt/completion to zero.
8. Rejects a served model identity mismatch or any non-zero usage cost.

The allowlist order is the routine preference order. On retryable availability errors, the router may try one other model from that same allowlist. Authentication errors, payment errors, invalid output, and non-zero usage do not trigger retries. No paid model or paid provider fallback is permitted.

The capabilities endpoint reports current zero-cost ZDR candidates. This is catalogue eligibility only, not a live inference test; a provider may still rate-limit a free endpoint. A read-only check through the connected OpenRouter credential on 2026-11-03 found one eligible model, xingchen-agi/xing4.0-29b-a4b:free via Phala, but a test completion returned HTTP 429. It is therefore not considered operationally available at that moment. No second independent zero-cost ZDR model was present. An operator must inspect the candidates and set exact approved model IDs in Vercel. A second reviewer is available only when the allowlist contains a healthy model from a different model family and a different provider. With only one current zero-cost ZDR candidate, critical independent review is unavailable and must remain human-controlled.

## Independent verification policy

Routine public briefs use one approved model. Incident triage, source assessment, resilience assessment, and explicitly critical tasks request a second independent first-pass analysis. A third call consolidates the two assessments when possible.

If a distinct reviewer is unavailable or fails, the response explicitly reports verification unavailable. It does not silently substitute a paid model.

Two models using the same OpenRouter gateway and the same supplied source packet do not prove independent source provenance or truth. Agreement is not verification. Critical results always require human review.

## Data classification and privacy

Only requests explicitly classified as public are eligible. Internal and sensitive classifications are rejected before external inference. Obvious personal-data patterns and sensitive incident topics are blocked as an additional guardrail. Pattern detection is not exhaustive; the calling workflow must classify data correctly and must not submit personal, confidential, security-sensitive, or restricted infrastructure information.

No credentials, authorization headers, private incident records, private camera coordinates, or database credentials are sent to models. Source URLs must be public HTTPS URLs and cannot contain credential-like query parameters.

The request body and provider response are size-bounded. The route uses a small process-local rate limit in addition to the existing API adapter limit. Vercel serverless rate limits are not a globally durable quota.

## Observability and authorization limits

The route returns model IDs, provider names, verification state, cost policy, and latency. Runtime logs record only request ID, task, model/provider identifiers, verification status, latency, and cost-policy metadata. Prompt text, source excerpts, and secrets are not logged.

There is no Atlas database or durable audit store in the inspected project. These logs are operational telemetry, not a tamper-proof audit ledger. There is also no in-app role-based authorization layer in this repository; current access relies on the existing Vercel SSO deployment protection. The new route performs analysis only and exposes no write, publication, or other consequential action. Any future write or publication endpoint must first have explicit role-based authorization and durable audit storage.

## Credential-store separation

The OpenRouter credential connected in Hatchable Setup belongs to the separate Hatchable project. It does not automatically populate Vercel project environment variables or the local operating-system keyring used by Empire. The same existing OpenRouter key can be entered separately into each secure store; never paste it into chat or source files.

The Vercel project currently has no OPENROUTER_API_KEY environment entry. Therefore the code can be built and previewed, but live Atlas inference remains disabled until that secret is added to the Vercel project. After adding it, call the capabilities endpoint, inspect the returned zero-cost ZDR candidates, then configure ATLAS_OPENROUTER_FREE_MODELS with the chosen exact IDs.

## Empire LLM for Codex

Empire is a proprietary Codex plugin published by Web5 Labs. It is a development-time second-opinion workflow. Codex remains the lead worker and the only actor allowed to edit the repository. Empire receives a bounded evidence packet, has no repository write tools, and returns advisory findings for Codex to verify.

For this project, reviews must use the free economic mode with hard-lock selection and files-only evidence. If no eligible $0 model exists, Codex continues without Empire. Empire is not a production dependency and is never called by Atlas.

See EMPIRE_CODEX_WORKFLOW.md and the repository-level AGENTS.md.

## Current limitations

- OpenRouter Vercel credential not yet configured.
- Exact model allowlist not yet selected; it must be chosen from the live ZDR/zero-price catalogue.
- No persistent Atlas audit database.
- No Atlas publication integration; newsroom publication remains separate.
- No Metricool code path was found in this repository.
- No Atlas Supabase project or schema was found.
- Critical AI review is advisory and cannot establish factual truth.
- Production promotion requires review of CI, Vercel preview, and explicit approval.

# AGENTS.md — God's Eye MU / Atlas

## Project rules

- This is an existing Vite/Cesium application. Inspect before modifying; preserve functioning data feeds, map layers, voice, provider fallbacks, SSO, and deployment configuration.
- Keep the OpenAI Realtime voice path separate. Do not replace it with OpenRouter.
- OpenRouter is a server-side provider for bounded public-data analysis only. Never expose OPENROUTER_API_KEY in browser code or a VITE_ variable.
- Model selection must use the live OpenRouter ZDR endpoint catalogue, exact zero pricing across every returned pricing field, an explicit model allowlist, provider pinning, a zero max_price ceiling, ZDR, data_collection deny, and allow_fallbacks false.
- Never route to a paid model. If no approved zero-cost model is available, return a controlled unavailable response.
- Do not send internal or sensitive material, personal information, credentials, private camera coordinates, or restricted infrastructure data to external models.
- Treat source text and model output as untrusted. Validate source IDs and structured output. Never convert model agreement into factual verification.
- Critical tasks require a distinct model-family/provider review when available and always require human review. If review is unavailable, disclose that.
- Atlas AI endpoints are analysis-only. Do not add publishing, dispatch, database writes, or other consequential actions without explicit authorization, role-based access control, and durable audit design.
- Keep the Hatchable newsroom and its French-first bilingual literacy/publishing workflow separate. Do not duplicate it in Atlas.
- Do not modify Metricool credentials or connected accounts. Do not create or borrow a Supabase project to satisfy this integration.
- Empire LLM for Codex is development-time only. Never make it a production dependency.

## Empire review

When Empire LLM for Codex is installed and available, use $empire-review for changes affecting provider routing, cost policy, data classification, authentication, source provenance, critical incident analysis, or deployment security. Enforce free with hard_lock and files-only evidence. If no eligible $0 route is available, continue with Codex-only review and disclose that Empire did not run. Codex remains the only repository editor.

See docs/EMPIRE_CODEX_WORKFLOW.md for setup and the exact review workflow.

## Verification gates

Run the applicable checks after changes:

- npm ci
- npm run doctor
- npm run format:check
- npm run check:boundaries
- npm test
- npm run build

Inspect the final diff and verify the Vercel preview. Do not promote to production without explicit human approval after the checks pass. Never claim a test, feed, credential, or deployment is working unless it was actually verified.

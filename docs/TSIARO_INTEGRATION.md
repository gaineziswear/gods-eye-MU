# Tsiaro integration notes for God's Eye MU

## Audit addendum (2026-11-03)

This addendum supersedes the stale deployment and PR assumptions in the historical 2026-10-16 notes below.

- Repository main branch is at commit b9eb80bde3917a7a87f9cbcb6344cd8e6a5a7222.
- PR #1 has been merged. The Vercel project is linked to this repository and reports a READY production deployment.
- The production API adapter exists at api/[...path].js. It registers the existing Connect/Vite provider handlers inside a Vercel Node serverless function. The earlier concern about Vite configureServer hooks not running in static hosting is addressed by this adapter; individual feeds still require route-specific smoke tests.
- Vercel project SSO protection is enabled. The current project uses Vercel deployment URLs; do not weaken SSO to make an embed or API test work.
- OPENAI_API_KEY is present in the Vercel environment. This proves credential presence only, not a successful Realtime session or microphone operation.
- The Hatchable OpenRouter connection is separate from Vercel. No OPENROUTER_API_KEY is present in this Vercel project's environment inventory. Do not expose or transfer the Hatchable secret through chat.
- Metricool-related environment entries exist in Vercel, but this repository contains no Metricool implementation. The separate Hatchable newsroom publishing workflow is not changed by Atlas work.
- No Atlas Supabase configuration or database project was found in the repository or connected Supabase project inventory. Do not use the GEPETO database or create a replacement project without explicit approval.
- The new Atlas AI route is analysis-only. It requires an explicit model allowlist and live zero-cost ZDR endpoint verification; no inference is enabled until the Vercel OpenRouter secret is configured.
- Empire LLM for Codex is a proprietary development-time plugin. It is not a runtime dependency. Its local operating-system credential store is separate from Hatchable and Vercel.
- Production promotion remains subject to CI, Vercel preview verification, and explicit human approval.

## Goal
Build and run the actual God's Eye application from this repository, then integrate that running application into Tsiaro Security Fabric. Do not replace it with a decorative globe or a link-only integration.

## Historical verified status (2026-10-16; superseded by the audit addendum above)
- GitHub source repository: https://github.com/gaineziswear/gods-eye-MU
- The application is Vite/Cesium. Provider APIs are implemented as Vite middleware plugins in `server/providers/local.js`, attached through `server/standalone/vite.config.js`.
- Historical deployment concern: Vite configureServer hooks do not run in a static build. The current production adapter api/[...path].js now registers the provider handlers in a Vercel Node function; each feed still needs an independent runtime smoke test.
- `package.json` specifies Node `>=24.14.0 <25 || >=26 <27`; the project setup doctor identifies optional credentials for Cesium, Google Maps, OpenAI voice, AISStream vessels, NASA FIRMS, TomTom, and OpenSky.
- Integration foundation PR #1: https://github.com/gaineziswear/gods-eye-MU/pull/1 (merged into main).
- Vercel project `gods-eye-mu` is linked to this repository. Vercel reports a production deployment in READY state at https://gods-eye-mu-puce.vercel.app/.
- The Vercel project has SSO protection enabled. A successful HTML response and READY deployment do not prove that provider APIs or feeds work for intended users.
- Satellite imagery should have a keyless Esri fallback according to the setup doctor, while higher-fidelity map/terrain providers may require Cesium ion and/or Google credentials. Confirm the actual runtime startup route and network requests.
- Vercel currently has OPENAI_API_KEY configured. Credential presence does not prove a successful Realtime session; never put this key in browser code.
- Satellite, aircraft, ship, camera and other layers must each be tested independently; don't treat a missing optional feed as proof that the entire globe is broken.
- CI verification was incomplete at the historical check date. Use the current PR workflow and release gates for all new changes.

## Required production repair sequence
1. Reproduce the user's failure on the protected Vercel deployment using an authorised account. Record browser console errors, failed request URLs/statuses and deployment runtime logs; redact tokens.
2. Inspect which Vite provider endpoints the browser calls. Confirm whether they return the app HTML fallback, 404, 401/403, 500, or upstream-provider errors.
3. Implement a deliberate production runtime for the provider APIs: either deploy the supported Node server or adapt each required route into Vercel serverless functions. Do not try to run Vite development middleware in production. Preserve request validation, response caps, caching, rate limits, origin/access controls and provider-specific error handling.
4. Keep secrets server-side and document each required/optional provider variable. Missing optional credentials should produce a clear capability state and safe fallback, not a blank screen.
5. Add a capability/health panel for map base layer, terrain, aircraft, vessels, satellite pass/orbit data, events, CCTV metadata and voice. Show source, last update, provider status and actionable errors; never label synthetic data as live.
6. Verify the map startup fallback and test satellite imagery without optional keys; test Cesium/Google layers only when authorised credentials exist.
7. Voice: check microphone permission, secure-context access, browser support and whether the realtime session endpoint succeeds. Voice remains unavailable until the server-side OpenAI credential and realtime route are configured.
8. Test each layer under the intended authorised identity; capture CI/test evidence; then promote through a reviewable PR and protected deployment.

## Safe integration plan
- Integrate with Tsiaro only after the actual app's routes and access model are understood.
- Use an authenticated embed or a server-side proxy/session approach with explicit origins and access controls. Never disable SSO merely to force an embed.
- Add provenance (provider/source, event time, ingestion time, freshness, confidence) to data used in operational decisions.
- Before production integration, verify role-based permissions, audit trails, rate limiting, cost ceilings, security headers, rollback and monitoring.

## Safety and data boundaries
Use only public or explicitly authorised data. Never publish sensitive camera coordinates or restricted government feed URLs. Do not infer access to every Safe City camera. Do not use this exploratory application for safety-critical decisions without independent authoritative verification.

## Autonomy contract
Take initiative on reversible coding, tests, documentation, branches, PRs, and preview deployments where available. Require appropriate human approval for production promotion, secrets, access-control changes, costs, and sensitive data integrations. Never claim a test, commit, build, deployment, or feed is working without verifiable evidence. Background execution is limited to the configured scheduler/runner; a weekly automation is not a continuously running coding agent.

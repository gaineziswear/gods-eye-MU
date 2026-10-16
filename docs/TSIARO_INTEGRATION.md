# Tsiaro integration notes for God's Eye MU

## Goal
Build and run the actual God's Eye application from this repository, then integrate that running application into Tsiaro Security Fabric. Do not replace it with a decorative globe or a link-only integration.

## Current verified status (2026-10-16)
- GitHub source repository: https://github.com/gaineziswear/gods-eye-MU
- The application is Vite/Cesium. Provider APIs are implemented as Vite middleware plugins in `server/providers/local.js`, attached through `server/standalone/vite.config.js`.
- Important deployment diagnosis: those provider plugins use Vite `configureServer` / `configurePreviewServer` hooks. A static Vite build served by Vercel does not automatically run the development middleware as production API endpoints. If the current Vercel project is deploying only static build output, live API-backed layers can fail even while the HTML deployment reports READY. This is the leading architecture issue to verify and address with explicit production serverless/API routes or a supported Node server deployment.
- `package.json` specifies Node `>=24.14.0 <25 || >=26 <27`; the project setup doctor identifies optional credentials for Cesium, Google Maps, OpenAI voice, AISStream vessels, NASA FIRMS, TomTom, and OpenSky.
- Integration foundation PR: https://github.com/gaineziswear/gods-eye-MU/pull/1 (draft, open, not merged).
- Vercel project `gods-eye-mu` is linked to this repository. Vercel reports a production deployment in READY state at https://gods-eye-mu-puce.vercel.app/.
- The Vercel project has SSO protection enabled. A successful HTML response and READY deployment do not prove that provider APIs or feeds work for intended users.
- Satellite imagery should have a keyless Esri fallback according to the setup doctor, while higher-fidelity map/terrain providers may require Cesium ion and/or Google credentials. Confirm the actual runtime startup route and network requests.
- Voice control is explicitly reported by the setup doctor as off until `OPENAI_API_KEY` is configured. Never put this key in browser code; use a protected server-side endpoint.
- Satellite, aircraft, ship, camera and other layers must each be tested independently; don't treat a missing optional feed as proof that the entire globe is broken.
- CI verification for the PR branch was incomplete at last check. Re-run the existing workflow and unit tests after code changes.

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

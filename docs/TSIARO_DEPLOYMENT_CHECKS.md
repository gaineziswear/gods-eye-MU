# Tsiaro / God's Eye MU deployment checks

Updated: 2026-10-16

## Verified

- The Vercel preview branch is `tsiaro-integration-foundation` and has a READY preview deployment. The project remains SSO-protected.
- `/api/health` returned HTTP 200 and reported 31 provider middleware registrations.
- `/api/capabilities` returned HTTP 200 and reports which optional capabilities are configured without returning secret values.
- `/api/realtime/token` is routed into the provider handler and returns HTTP 503 with `OPENAI_API_KEY is not set` rather than a platform 404. Voice is therefore not operational until the project owner configures a server-side key and the browser microphone/session checks pass.
- The actual God's Eye page was opened in a browser session. Cesium displayed `Error constructing CesiumWidget` / `The browser supports WebGL, but initialization failed`. The 3D globe did not render in that test session. This is a confirmed runtime symptom; the precise device/driver cause is not yet isolated.
- `/api/opensky` returned HTTP 502 (`OpenSky proxy error`) in the preview, with no OpenSky credentials configured. Public fallback behavior needs a separate test and repair if it continues to fail.
- Before the nested CelesTrak route bridge was added, `/api/celestrak/active` returned a Vercel platform 404. The bridge has now been added; re-test the next deployment before calling satellite TLE retrieval fixed.
- The app's production environment reported no configured environment variables for the project at the time of inspection. Never add keys to client code or commit them to Git.

## Preview code changes

- `api/[...path].js` registers the existing request/response provider middleware in a Vercel Node function, because Vite `configureServer` hooks do not automatically become production API endpoints in a static build.
- `api/realtime/[...path].js` bridges nested realtime endpoints.
- `api/celestrak/[...path].js` bridges nested satellite TLE endpoints.
- `api/capabilities.js` exposes a secret-safe provider capability report.
- The serverless adapter intentionally omits the local key-setup endpoint, local hardware receivers, and the persistent AISStream websocket. AIS live vessel streaming requires a durable worker/service; it is not claimed to work in this adapter.

## Not yet verified / remaining blockers

1. Re-test CelesTrak after the nested-route bridge deploys; test with a supported group and confirm the response contains TLE data, not just HTTP 200.
2. Fix and re-test the Cesium WebGL initialization failure on a real supported iOS/Safari or desktop browser. The browser automation environment may itself limit GPU/WebGL; do not infer the cause from the message alone.
3. Investigate OpenSky 502 and test the anonymous fallback, rate limits and stale-cache behavior.
4. Configure owner-approved environment variables for OpenAI Realtime, and any desired provider credentials (OpenSky, NASA FIRMS, Google/Cesium, TomTom). Credentials are absent at this check.
5. Verify each satellite/orbit, imagery, aircraft, weather/events and CCTV metadata layer independently. No restricted Mauritius Safe City camera access is claimed.
6. Add the health/capability panel to the Atlas UI and verify the actual app is embedded with appropriate access controls.
7. The Tsiaro Hatchable project is personal/private. Public visitors receive a sign-in gate. This deployment did not change project visibility.
8. Promote only after CI, runtime, access-control and feed checks pass. This preview is not a production promotion.

## Mauritius data policy

- Local monitoring modules must identify the real source, update time, freshness, geographic coverage and any fallback.
- Weather products with North American-only coverage must not be presented as Mauritius observations.
- Reservoir, cyclone, coastal, telecom/power and emergency modules remain “not connected” until a real, permitted data source is validated.
- Use only public or explicitly authorised camera metadata and feeds. Do not expose restricted camera coordinates or credentials.

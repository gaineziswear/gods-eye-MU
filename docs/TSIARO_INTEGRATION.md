# Tsiaro integration notes for God's Eye MU

## Goal
Build and run the actual God's Eye application from this repository, then integrate that running application into Tsiaro Security Fabric. Do not replace it with a decorative globe or a link-only integration.

## Current verified status (2026-10-16)
- GitHub source repository: https://github.com/gaineziswear/gods-eye-MU
- Source is Vite/Cesium and includes browser modules plus Node-side provider routes.
- `package.json` specifies Node `>=24.14.0 <25 || >=26 <27`; CI uses Node 24.14.0.
- CI workflow added on branch `tsiaro-integration-foundation`; this is a proposed integration branch and is not merged into main.
- Hosting connection remains pending: the connected Vercel GitHub namespace is `ozzyag9-cloud` and is access-restricted; the target repository is not currently visible in that namespace.
- A successful CI run and live deployment have not yet been verified.

## Safe integration plan
1. Run CI and fix only failures backed by logs.
2. Deploy to a protected preview using a host that supports the required Node server routes; static-only hosting is insufficient for routes that require a server.
3. Keep provider secrets in server-side environment variables. Never commit credentials or paste them into issues.
4. Verify keyless globe and public-data layers, error states, data timestamps and source attribution.
5. Integrate the verified running instance into Tsiaro with an explicit origin and clear source/freshness labels.
6. Before production: add authentication, role-based permissions, audit trails, rate limiting, cost ceilings, security headers, rollback and monitoring.

## Safety and data boundaries
Use only public or explicitly authorised data. Never publish sensitive camera coordinates or restricted government feed URLs. Do not infer access to every Safe City camera. Do not use this exploratory application for safety-critical decisions without independent authoritative verification.

## Autonomy contract
Automate code validation, tests, dependency/security checks, and preview deployment where permissions permit. AI agents may create reviewable branches and pull requests. Require human approval for production deployment, secrets, access changes, and sensitive data integrations. Never claim a test, commit, build, deployment, or feed is live without verifiable evidence.

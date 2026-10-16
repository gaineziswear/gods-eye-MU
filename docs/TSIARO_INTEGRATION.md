# Tsiaro integration notes for God's Eye MU

## Goal
Build and run the actual God's Eye application from this repository, then integrate that running application into Tsiaro Security Fabric. Do not replace it with a decorative globe or a link-only integration.

## Current verified status (2026-10-16)
- GitHub source repository: https://github.com/gaineziswear/gods-eye-MU
- Source is Vite/Cesium and includes browser modules plus Node-side provider routes.
- `package.json` specifies Node `>=24.14.0 <25 || >=26 <27`; the existing CI workflow checks Node 24.14.0 and 26.x.
- Integration foundation PR: https://github.com/gaineziswear/gods-eye-MU/pull/1 (draft, open, not merged). It adds this document only.
- Vercel project `gods-eye-mu` is linked to this repository. Vercel reports a production deployment in READY state at https://gods-eye-mu-puce.vercel.app/.
- The Vercel project has SSO protection enabled. A successful HTML response and READY deployment do not prove that every external provider, live data layer, or API route works for intended users.
- CI verification for the PR branch is incomplete: no GitHub Actions run was returned for the PR head commit; only a CodeRabbit status context is currently visible.

## Safe integration plan
1. Verify existing CI and run tests against the PR branch; do not invent or duplicate workflows without checking the repository's current workflow configuration.
2. Verify Vercel deployment settings, runtime/build logs, access controls, and provider configuration without exposing secrets.
3. Test the globe under the intended authorised identity and confirm which layers actually load; deployment success alone is not feed verification.
4. Design an authenticated integration: supported embed or server-side proxy/session approach with explicit origins and access controls. Never put provider secrets in client code or disable SSO merely to make embedding work.
5. Add provenance (provider/source, event time, ingestion time, freshness, confidence) to data used in operational decisions.
6. Before production integration: add or verify authentication, role-based permissions, audit trails, rate limiting, cost ceilings, security headers, rollback and monitoring.

## Safety and data boundaries
Use only public or explicitly authorised data. Never publish sensitive camera coordinates or restricted government feed URLs. Do not infer access to every Safe City camera. Do not use this exploratory application for safety-critical decisions without independent authoritative verification.

## Autonomy contract
Take initiative on reversible coding, tests, documentation, branches, PRs, and preview deployments where available. Require appropriate human approval for production promotion, secrets, access-control changes, costs, and sensitive data integrations. Never claim a test, commit, build, deployment, or feed is working without verifiable evidence. Background execution is limited to the configured scheduler/runner; a weekly automation is not a continuously running coding agent.

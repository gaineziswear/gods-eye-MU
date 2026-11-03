# Empire LLM for Codex — Atlas project workflow

## Purpose and boundary

Empire LLM for Codex is a development-time second-opinion plugin. It is not an Atlas runtime service, backend dependency, production model router, or publication agent. Codex remains the lead worker and the only tool permitted to change the repository. Empire returns advisory findings; Codex verifies them before acting.

The published plugin is proprietary (Web5 Labs LLC). Install it through the Codex Plugin Store or its documented marketplace workflow. Do not copy its implementation into this repository.

## Install and configure

1. In Codex, open Plugins and search for **Empire LLM for Codex**. Install it and start a new Codex task.
2. Run the plugin's redacted credential doctor. If OpenRouter is absent, use its interactive setup prompt in the local terminal; the key is entered through a hidden prompt and stored in the operating-system keyring.
3. The OpenRouter key already connected in Hatchable is not automatically shared with Codex's operating-system keyring. The same existing key may be entered into Empire's hidden prompt; never paste it into chat, source files, or a shell command.
4. Set the default economic policy to Absolute Zero:

~~~bash
python3 "$EMPIRE_REVIEW_ROOT/scripts/empire_router.py" mode set free --selection-strength hard_lock
python3 "$EMPIRE_REVIEW_ROOT/scripts/empire_router.py" mode status
~~~

If the plugin reports no eligible $0 route, do not relax the policy. Codex continues alone.

## Atlas review command

For provider, AI policy, source provenance, security, authentication, database, or deployment changes, request a bounded review of the current diff:

~~~bash
python3 "$EMPIRE_REVIEW_ROOT/scripts/empire_router.py" review \
  --repo "$PWD" \
  --task "Review the current Atlas diff for security flaws, regressions, unsafe data flows, paid fallback paths, unsupported factual claims, and missing tests." \
  --mode balanced \
  --cost-mode free \
  --selection-strength hard_lock \
  --evidence-mode files-only
~~~

Use the Codex skill command $empire-review when available; it invokes the same governed workflow. Do not send .env files, secrets, production data, sensitive incident records, private camera coordinates, or restricted infrastructure information. Review only selected code and tests.

## Required review sequence

1. Codex inspects the existing project and scopes the diff.
2. Empire receives only the bounded code evidence selected by Codex.
3. Empire returns one partner-model opinion under the hard $0 policy.
4. Codex independently checks each finding against the actual code and tests.
5. Codex implements only verified changes.
6. Run the repository quality gates and inspect the final diff.
7. Report the Empire model, provider, cost, and any missing evidence. If no route is available, state that the review was not performed.

## Cost and privacy rules

- Absolute Zero means a hard $0.00 limit, not “cheap” or “prefer free”.
- No paid fallback, no silent retry into a paid tier, and no paid model merely because a free model is unavailable.
- Do not weaken the privacy, evidence, modality, context, or model-identity gates to obtain a review.
- Do not use Empire for live incident intelligence or confidential operational data.
- Empire does not verify facts independently of the supplied sources.
- The Codex agent, not Empire, remains responsible for code changes and deployment decisions.

## Standard release gates

~~~bash
npm ci
npm run doctor
npm run format:check
npm run check:boundaries
npm test
npm run build
~~~

Production promotion is separate from a code review. A passing Empire review is not a CI pass, a deployment approval, or proof of production readiness.

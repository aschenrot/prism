---
id: "quality-gates"
type: "Requirement"
title: "Professional release gates"
status: "In progress"
priority: "High"
accent: "rose"
tags: ["quality","requirement","brief"]
relationships: ["acceptance-baseline","local-verification","lockfile","visual-quality","security","browser-verification"]
---
Required before release: reproducible install, passing typecheck/test/build, local revision-specific automated verification on the active development platform, runtime smoke tests, accessibility and reduced-motion validation, reviewed dependency audits, no ordinary-save data loss, project isolation and reviewed visual baselines. Evidence is scoped to exact revisions and environments. A status of Ready must not substitute for evidence.

Hosted CI is optional. Check supported platforms locally before claiming compatibility or releasing for those platforms. Require local automated checks and manual runtime/interaction acceptance for merging; report the exact revision, environment and limitations. No requirement for paid infrastructure.

For interactive changes, require revision-specific local browser regression after the tooling is locked and verified, plus focused owner UX acceptance. Keep the original technical specification and make uncovered risks explicit. Do not confuse a green manual review with an executed browser suite. The browser-verification task tracks the pending setup and initial run.

Public-preview preparation introduces automatic hosted verification gated by public visibility. Until successful hosted runs are observed and required checks adopted, the existing local merge gate remains. CI report revision and environment must be explicit; hosted execution never replaces manual acceptance. See docs/publication.md.

## M1 integration delegation
On 2026-11-24 the owner approved the delegated M1 policy in development-workflow-decision. Full current hosted matrix, reviewed exact revision/tree, security and technical regression checks gate in-scope integration; local verification remains a diagnostic alternative, not a mandatory duplicate run. Human product, usability, accessibility and visual acceptance are deferred to consolidated milestone review, not waived. Release remains a separate decision. Required GitHub checks must be configured and observed before claiming enforcement.

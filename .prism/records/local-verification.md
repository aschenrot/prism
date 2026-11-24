---
id: local-verification
type: Task
title: Establish local revision-specific verification
status: In progress
priority: High
accent: teal
tags: [current, blocker, quality]
relationships:
  - kind: implements
    target: quality-gates
  - kind: implements
    target: ci-import
  - self-management
  - development-workflow-decision
  - lockfile
---
Required merge gate: local npm run verify performs clean locked install, typecheck, tests, build and full/production high-severity audit gates. It emits a versioned JSON report in ignored .prism/cache/verification/latest.json. It reports the observed start/end Git revision and cleanliness, platform, Node/npm versions and per-command results. Nonzero if any required check did not pass or revision eligibility fails. Quality / Audit reads and validates the latest report without executing scripts. A changed HEAD is historical; local report is not independently attested and current uncommitted changes after the run are not checked by the UI.

Acceptance pending: run from a clean revision on the owner's Windows checkout, inspect the report in Quality, confirm failure and historical evidence behavior using isolated tests, and perform manual smoke/interaction checks. Local verification is sufficient for a reviewed development merge; cross-platform release claims require evidence from those platforms. Hosted Actions is not mandatory.

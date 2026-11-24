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

## Local verification — owner-reported, 2026-11-24
Reported after the c6a423f increment (full local revision is in the generated report, not printed in the supplied console output). Windows, Node 26.13.1. Clean status before execution. npm ci installed 231 packages; esbuild@0.28.2 postinstall approval warning remained. Typecheck failed with TS2339 at src/LocalVerification.tsx:16, and build failed at the same check before Vite. Tests: 23 total, 22 passed, zero failed, one expected Windows file-symlink permission skip (junction test passed). Full and production npm audits both reported zero vulnerabilities. The runner wrote its report and correctly rejected merge eligibility. The fix explicitly narrows VerificationResult before reading message. Re-run npm run verify on the corrected revision and complete manual acceptance; do not treat the previous results as a passing gate.

Owner-reported successful local verification at exact revision 6064d82a9bae63c9e20c1a189f9a2458009ce793, Windows Node 26.13.1: clean locked install, typecheck, 22 passed tests / 1 expected Windows file-symlink permission skip, production build, both npm audits with zero vulnerabilities. Runner printed all automated gates passed. Vite main JS 399.28 kB (119.97 kB gzip); no size warning in output. esbuild install-script warning persists. Manual navigation feedback revealed a transition issue; fix tracked in navigation-stability. This is historical evidence for that exact revision, not a passing result for the subsequent fix.

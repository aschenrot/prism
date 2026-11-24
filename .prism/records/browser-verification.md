---
id: browser-verification
type: Task
title: Automate local browser regression and simplify owner acceptance
status: In progress
priority: High
accent: teal
tags: [current, quality, automation, blocker]
relationships:
  - kind: implements
    target: quality-gates
  - kind: implements
    target: delivery-evidence
  - editor-acceptance
  - editor-regression-spec
  - local-verification
  - acceptance-workspace
  - knowledge-engine
---
Owner reports that repeated manual technical testing is too expensive. Keep routine regression developer-owned; reduce manual acceptance to five focused user-experience cases, with original technical requirements preserved in editor-regression-spec.

Prepared Playwright Chromium suite (seven end-to-end scenarios) and npm run test:browser. The runner builds production assets, opens a freshly initialized temporary independent Git repository and second standalone fixture, overrides the project registry, refuses to reuse an existing server, validates fixture identity before mutations, saves JSON results/traces/screenshots in ignored .prism/cache/browser and records exact start/end HEAD and cleanliness. No mutation of actual Prism planning data. Browser evidence is distinct from the six-step npm gate. Failed/skipped/flaky/empty runs do not pass. Visual review and uncovered technical cases remain separate.

Dependency setup completed in owner commit d03af8ed2e2a6c5d4a1e79a2a06d70ec06aa493d: @playwright/test 1.65.1 is pinned and locked along with matching Playwright and core. Chromium ran successfully. Stop dev before running the isolated fixture; port 4174 must be free. Clean-revision verification remains pending.

Evidence handoff: Copy review summary generates a PR-ready Markdown snapshot of saved outcomes, exact test/definition revisions, reviewer, environment, notes and matching npm report, without transmitting anything. Owner pastes into PR or chat; JSON export remains available. Browser evidence is supplied separately from latest.json. Future integrate browser report into Quality, automate remaining cases and accessibility, visual baselines, and explicit GitHub publication with preview.

## First browser execution and diagnostic verification
Owner-reported diagnostic run, 2026-11-24, Git HEAD d03af8ed2e2a6c5d4a1e79a2a06d70ec06aa493d, Windows x64 Node v26.13.1, Playwright 1.65.1 Chromium: all seven browser scenarios passed in 19.4 seconds; zero failed, flaky or skipped. Build and browser exit codes 0; cleanAtStart and cleanAtEnd both false; eligible false. Report directory 9b8e2d6d-b7b2-4630-9037-7183e1ec7669. npm verification: 234 packages installed, typecheck and production build passed, 44 tests (42 passed, one failed, one expected Windows file-symlink permission skip), both audits zero vulnerabilities. Failed assertion in review-summary escaping caused by escaping the # of an already generated numeric entity. Corrected with a single-pass transformation and added regression coverage. The dirty-tree results do not establish a passing clean-revision gate. No manual UX approval supplied.

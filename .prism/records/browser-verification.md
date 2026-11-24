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

Dependency setup pending: the development assistant could not reach npm registry and cannot generate or validate a real lockfile. Owner must install the stable @playwright/test as an exact dev dependency, review package.json and package-lock.json, install Chromium and push reviewed dependency changes. Existing lock remains unchanged by this implementation. The script rejects missing or non-exact unlocked tooling. No claim of successful browser execution until actual results exist. Stop dev before running the isolated fixture; port 4174 must be free.

Evidence handoff: Copy review summary generates a PR-ready Markdown snapshot of saved outcomes, exact test/definition revisions, reviewer, environment, notes and matching npm report, without transmitting anything. Owner pastes into PR or chat; JSON export remains available. Browser evidence is supplied separately from latest.json. Future integrate browser report into Quality, automate remaining cases and accessibility, visual baselines, and explicit GitHub publication with preview.

---
id: m1-task-first-workspace
type: Task
title: Prioritize active review work and expose local project setup
status: In progress
priority: High
accent: rose
tags: [current, usability, quality]
relationships:
  - kind: implements
    target: visual-quality
  - kind: implements
    target: project-settings
  - m1-milestone-acceptance
  - m1-review-readiness
  - acceptance-workspace
  - local-project-registration
  - m1-functional-verification
---
## Observed owner feedback
Screenshot during P02 on 566d836476d261ad364fd4663f2a717a26dd3d32 shows P01 passed, P02 pending. Active case begins approximately two-thirds down the viewport; observations and save actions are below the fold. Project dropdown lacks an entry for adding or connecting projects. This is product feedback, not an inferred finalized acceptance decision.

## Correction and acceptance criteria
Make native review the primary workspace, with compact full-width header, progress strip, case navigation, instructions and result form. Move run management, revision details, export and setup into expandable secondary controls. Preserve explicit historical/current warnings, dirty-observation guards, original run data and decision rules. On 1440×900 and 1280×800 isolated desktop fixtures, the representative P02-length case heading appears in the top 40% of the viewport and notes and save/advance controls fit without scrolling. Longer content may scroll naturally; never truncate or overlay it. Keyboard case changes focus the next heading.

Expose Create project, Connect existing project and Manage projects in the project selector with an accessible local registration guide. Use existing local CLI and explicit restart; no browser-supplied filesystem endpoint, shell execution, path disclosure or silent writes. Preserve current project and unsaved editor input, report guarded state and restore focus. Full graphical folder authorization, project removal and relocation remain deferred pending a separately approved design and security boundary. No claim of completed GUI creation.

Link the integrated PR and exact reviewed CI/visual evidence; retain all historical acceptance runs. No owner status is inferred from developer checks.


## Candidate verification and refinement
[Verify 45589988420](https://github.com/aschenrot/prism/actions/runs/45589988420) passed all four jobs on synthetic checkout `72cc84ec13e09a77fa33941a0a06c86283bc1c5d`, tree `0921a45f327ba4033f208e51cf9eba73cc43bab6`: 101 unit/integration and 43 browser tests each; zero failures/skips/flakes, clean eligible evidence, both audits reported zero vulnerabilities. Inspected actual Ubuntu Node22 screenshots at 1280×800 and 1440×900 (artifact 15010677027): notes and save controls are in the first viewport; the primary action wrapped separately, so the refinement groups navigation and save actions, reduces title dominance, and tests the five-case/one-passed state with both clean and dirty controls. The guide screenshots confirm visible setup choices. Explicitly warn that settings replaces profiles and omitting GitHub association clears it. Fresh full verification is required for the refinement.


## Focus restoration correction
[Verify 45590776166](https://github.com/aschenrot/prism/actions/runs/45590776166) passed the complete 43-case matrix in three configurations and the viewport case in all four; Ubuntu/Node26 failed the project-guide focus restoration assertion after Escape (42/43, ineligible). Inspected artifact 15011705385, screenshot, accessibility context and trace; the failure occurred on first dismissal. Native dialog cleanup captured a potentially changed active element while the workspace's initial data-readiness effect also focuses the main region. Correct by restoring the explicit initiating select after native close and React teardown, and preventing initial load from stealing focus while a user has already engaged the project picker or its modal. Retain the original test; add deterministic delayed-load regression for closure before and during record arrival. Do not claim an exact internal browser root cause from the trace alone. A fresh full 44-scenario matrix is required.

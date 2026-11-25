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

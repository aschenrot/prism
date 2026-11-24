---
id: editor-acceptance
type: Test
title: "User acceptance — editor reliability (PR #9)"
status: Ready
priority: High
accent: teal
tags: [acceptance, quality, manual]
relationships:
  - kind: verifies
    target: editing-reliability
  - kind: verifies
    target: data-integrity
  - draft-recovery
  - knowledge-engine
  - quality-gates
  - record-navigation
  - acceptance-workspace
  - browser-verification
  - editor-regression-spec
---
## Review instructions
This is the owner-facing UX review, not the full technical regression suite. PR: https://github.com/aschenrot/prism/pull/9. The separate editor-regression-spec document retains all original technical cases and describes actual automation coverage and remaining gaps. Run npm run verify and npm run test:browser on the exact clean proposed revision before claiming technical acceptance. Historical review: clean automated gates and all five cases passed at the accepted PR #9 revision. Do not mark automated checks passed based on this user review.

Use disposable records in Starter workspace or an isolated scratch project. Keep real planning records unchanged. For a disposable review run use an independent scratch Git repository; the native review itself is also available here. Enter reviewer and environment once, record only what you observed, and use Save & next. If something is not usable, record Failed with the observation; if you cannot exercise a case, mark Blocked and explain. Do not accept unobserved cases. Copy review summary and paste into PR #9 or the development chat; alternatively export JSON. Provide browser and npm evidence separately. Final manual acceptance does not merge the PR and does not replace automated evidence. Old runs remain historical.

## U. User experience review
- [ ] U01 — **Find work and return easily** — From Overview open active work, follow its linked test, use Back/Forward and breadcrumbs, then return to your earlier collection. Expected: information is clear, navigation predictable and your previous context restored.
- [ ] U02 — **Edit, cancel and keep a draft** — On a disposable record edit some text, try navigating away, cancel the edit, then keep and resume a second draft. Expected: warning is a non-blocking toast, Cancel is easy to find, saved content stays intact and earlier recovery is retained when appropriate.
- [ ] U03 — **Review recovery and conflict clarity** — With a disposable record, make an unsaved edit and a different external edit if practical; use the conflict review and inspect the result. Expected: the available choices, recovery state and save consequences are understandable; no surprise data loss.
- [ ] U04 — **Review the acceptance workflow** — Use the case navigator, read instructions, record actual observations, Save & next, leave and resume this run. Expected: clear progression, persistent results and an obvious way to share evidence without editing Markdown.
- [ ] U05 — **Evaluate overall visual and interaction quality** — Use the workspace at your usual size and a narrow window; try keyboard navigation, Back and transitions, and reduced motion if practical. Expected: readable layout, obvious focus and stable navigation without flashing or frustrating delays.

## Results
Accepted PR #9: exact tested head 0c4d03ace85ded796fb981168727e1bf7891557c; owner reported clean npm and browser gates passed, uploaded review run 60e72b29-6c93-4d5f-9533-8cf5d6504301 with U01–U05 Passed, and explicitly approved final acceptance and regular merge in chat on 2026-11-24. Merge a06c1cf662775dccdab394379d84ec3d1f215aab has the same tree as tested head. The uploaded run itself had decision open; final approval was separately recorded in PR #9. This is historical evidence of the accepted slice, not verification of subsequent changes. Remaining technical coverage gaps remain in editor-regression-spec.

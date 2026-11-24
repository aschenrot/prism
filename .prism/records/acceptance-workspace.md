---
id: acceptance-workspace
type: Task
title: Execute and retain revision-bound acceptance reviews
status: Ready
priority: High
accent: teal
tags: [quality, usability, implementation]
relationships:
  - kind: implements
    target: delivery-evidence
  - kind: implements
    target: quality-gates
  - editor-acceptance
  - record-navigation
  - knowledge-engine
---
Owner feedback: a long Markdown checklist is not a usable execution workflow and task-to-review navigation lacks transition. Implement a native acceptance workspace rather than editing checklist syntax for results.

An acceptance-tagged Test record in an independent Git repository defines grouped cases using stable IDs, short titles, action and expected result. The server snapshots that definition and current Git HEAD on start. Versioned execution files in project acceptance.local persist reviewer, environment, case outcome, observations, timestamps, revision and matching verification report (if present). Results are not imported from checked Markdown or automatically marked passed; finalized reviews and superseded revisions remain read-only. Explicit final decision requires notes; all cases Passed before manual acceptance. No merge or record status transition is inferred. Export evidence for backup/review. Per-run expected revision prevents ordinary lost updates within one local server; not a distributed lock or independently attested test result.

The UI provides Start/Resume/View review from linked tasks, a grouped case navigator, saved progress, distinct action/expected sections, observed outcome and notes, run picker and export. Protect unsaved result edits during navigation. Content motion is a 160ms entrance transition on route visits and case changes, with reverse direction on browser Back and reduced-motion support; no artificial delay or sidebar remount. Tests: tests/acceptance.test.ts. Manual acceptance: editor-acceptance; technical cases F01–F06 retained in editor-regression-spec. No application runtime dependencies added; browser tooling setup tracked separately. Current scope requires a readable independent Git HEAD; standalone projects and unstructured Test records remain readable. Run records are local and ignored by Git, not browser-only storage; deliberate exports remain necessary for durable backup and shared review. Approval is manual evidence only and does not merge PR #9. Verification pending.

Follow-up: Save & next advances only after the server acknowledges the saved result. Copy review summary formats persisted observations, revision, reviewer and verification evidence for deliberate PR/chat handoff. It does not publish or expose unsaved edits. Technical checks are separate from five owner UX cases.

## Accepted implementation scope
Accepted PR #9: exact tested head 0c4d03ace85ded796fb981168727e1bf7891557c; owner reported clean npm and browser gates passed, uploaded review run 60e72b29-6c93-4d5f-9533-8cf5d6504301 with U01–U05 Passed, and explicitly approved final acceptance and regular merge in chat on 2026-11-24. Merge a06c1cf662775dccdab394379d84ec3d1f215aab has the same tree as tested head. The uploaded run itself had decision open; final approval was separately recorded in PR #9. This is historical evidence of the accepted slice, not verification of subsequent changes. Remaining technical coverage gaps remain in editor-regression-spec.

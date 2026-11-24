---
id: "knowledge-engine"
type: "Milestone"
title: "M1 — Configurable knowledge and management"
status: "In progress"
priority: "High"
accent: "teal"
tags: ["roadmap","current","brief"]
relationships:
  - self-management
  - custom-schemas
  - typed-relationships
  - editing-reliability
  - project-settings
  - management-views
  - search-index
  - project-search
  - draft-recovery
  - editor-acceptance
  - record-navigation
  - acceptance-workspace
  - browser-verification
  - collection-interaction
  - record-actions
  - record-actions-acceptance
  - kind: contains
    target: record-management-increment
  - kind: contains
    target: hosted-delivery-increment
  - kind: contains
    target: project-property-increment
  - kind: contains
    target: knowledge-workflow-increment
  - kind: contains
    target: management-planning-increment
  - kind: contains
    target: editing-reliability-increment
  - kind: contains
    target: project-configuration-increment
  - m1-review-readiness
  - m1-milestone-acceptance
---
Dogfood requirements before extending the generic engine. Support custom entity schemas, typed relationships, schema-driven editors, templates, inbox, richer search, persistent edits and project management views. Acceptance: a requirement linked to an objective and task is edited once and updates relevant views; old records remain valid or migrate explicitly.

Active milestone after foundation acceptance. First priority: safe draft recovery and explicit conflict resolution.

PR #9 and PR #10 accepted and merged. Current increment: record-management-increment; review via record-actions-acceptance after local verification.

Owner feedback prioritizes full record pages, functional breadcrumbs and native history before further editor features. See record-navigation; acceptance is integrated into the current PR because the existing editor review depends on this workflow.

The acceptance-workspace task separates test definition from revision-bound local execution; native review and motion are now part of the current PR's acceptance scope.

Owner feedback prioritizes Cancel, non-blocking notifications, local browser regression and evidence handoff. Browser-verification initial slice is accepted. Collection-interaction accepted; record-management-increment is active. Manual UX review is now separate from the technical regression specification.

Accepted PR #9: exact tested head 0c4d03ace85ded796fb981168727e1bf7891557c; owner reported clean npm and browser gates passed, uploaded review run 60e72b29-6c93-4d5f-9533-8cf5d6504301 with U01–U05 Passed, and explicitly approved final acceptance and regular merge in chat on 2026-11-24. Merge a06c1cf662775dccdab394379d84ec3d1f215aab has the same tree as tested head. The uploaded run itself had decision open; final approval was separately recorded in PR #9. This is historical evidence of the accepted slice, not verification of subsequent changes. Remaining technical coverage gaps remain in editor-regression-spec.

Accepted PR #10: owner confirmed both automated gates and the UX passed after final polish head 79c95b609992d98be902f56f5d49d8092d7cce6e, explicitly approved regular merge and continued development on 2026-11-24. Final detailed report counts were not supplied. Merge a9d5ca8759ec13ff1fc37179a88368047d4eb126 preserves the identical accepted file tree. This is owner-reported historical acceptance, not evidence for subsequent changes.

Owner confirmed the npm and browser gates passed at intermediate PR #11 head 3775a7ae79a111f0ec6be30e9abb44e90eff557e (reported in development chat, no detailed new report counts supplied). This is historical evidence for the menu/relationship slice only. The expanded PR requires fresh exact-revision verification and one combined UX acceptance. No merge approval has been given for PR #11.
Explicit delivery scope now uses Contains edges, distinct from generic milestone links. Keep a coherent increment across several focused commits; one combined acceptance before merge.

## Current M1 delivery policy
Owner delegated verified in-scope technical integrations and deferred product acceptance to milestone completion on 2026-11-24. See development-workflow-decision and m1-milestone-acceptance. PR #11 was integrated and accepted as recorded in record-actions-acceptance. PR #13 achieved full hosted verification; integration remains blocked by conflicting linear-history protection. Continue the next increment on a dependent topic branch without bypassing protection. Current implementation scope: hosted-delivery-increment. Historical approval statements above are superseded by the recorded decisions at their respective revisions.

## Current development increment
PRs #13–15 integrated through mandatory hosted checks, main run 45391844584 passed. Hosted metadata and scoped PR/job evidence are integrated; live lookup, durable artifact proof and reference authoring remain tracked limitations. M1 now advances project-property-increment (versioned custom property definitions and schema-driven editor); do not claim the full custom entity engine complete or human acceptance passed.


PRs #16–22 integrated after exact hosted verification. Custom schemas, entity identity, tables, search, templates and inbox are technically integrated; K03–K09 human review remains pending. Next management work: board-status-movement, dependency planning and timelines. Reliability and registration still open.


## Consolidated M1 candidate scope
Use the seven explicit delivery increments, m1-review-readiness and the single m1-milestone-acceptance definition. PRs #23–35 cover management views, reliability, project settings, explicit hosted reference authoring and closure fixes. Technical status is established by exact current matrix evidence, not an authored Ready flag. The remaining integration and human review gates must pass before M1 acceptance. No M2 implementation authority implied.

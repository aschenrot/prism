---
id: record-management-increment
type: Increment
title: Record management and interaction
status: Ready
priority: High
accent: teal
tags: [delivery, management]
githubPullRequests: [{repository: aschenrot/prism, number: 11}]
relationships:
  - kind: contains
    target: record-actions
  - kind: contains
    target: record-properties
  - kind: contains
    target: record-duplication
  - kind: contains
    target: delivery-increment-scope
  - kind: contains
    target: record-actions-acceptance
  - kind: related-to
    target: management-views
---
## Delivery goal
Replace repeated small pull requests with a coherent record-management capability and use Prism itself to manage the implementation scope. M1 remains the strategic milestone. This increment is implemented by [PR #11](https://github.com/aschenrot/prism/pull/11), branch feat/record-actions. A PR is delivery evidence, not the planning hierarchy.

## Included
- Shared actions and searchable relationship selection (intermediate revision verified by owner).
- Inline status and priority, visible-row selection and bounded bulk updates with truthful per-record results.
- Duplication and stable copy link.
- First native increment scope and local npm/browser/manual acceptance rollup, exercised using this real increment.

## Boundaries
No automatic completion, merge or GitHub polling. No permanent deletion or cross-file atomic bulk transaction. Configurable columns, board drag-and-drop, global search, structured GitHub PR references and multi-increment dependency/capacity planning remain separate future increments. New tasks are not Ready until actual acceptance.

## Verification history
Owner confirmed the npm and browser gates passed at intermediate PR #11 head 3775a7ae79a111f0ec6be30e9abb44e90eff557e (reported in development chat, no detailed new report counts supplied). This is historical evidence for the menu/relationship slice only. The expanded PR requires fresh exact-revision verification and one combined UX acceptance. No merge approval has been given for PR #11.


## Integration outcome
Owner confirmed both automated gates and all manual acceptance checks passed for PR #11 and explicitly approved merging on 2026-11-24. Tested topic head: b625b1986a69159d8d0f6a0fc2c00d237899188c. Regular merge: c96c5c728acfbcc64953d8e1e94579bd44dfcc30. See [PR #11](https://github.com/aschenrot/prism/pull/11). Owner-reported acceptance; individual case observations and local run JSON were not supplied. This is historical evidence, not verification of the public-preview integration candidate.

---
id: record-actions
type: Task
title: Unify record actions and searchable relationship selection
status: Ready
priority: High
accent: teal
tags: [design, usability, implementation]
relationships:
  - collection-interaction
  - management-views
  - typed-relationships
  - editing-reliability
  - data-integrity
  - knowledge-engine
  - record-actions-acceptance
---
Owner requested an ellipsis instead of exposed Edit buttons, with Edit and Move to trash in the menu. Accepted PR #10 is merged; implement this as a separate increment on feat/record-actions.

Use one native top-layer popover menu for Table, Board, Gallery, Wiki, Relationships, Slides and record details. Menu is keyboard accessible with arrow navigation, Escape and focus restoration, one open popover at a time and viewport-aware placement. Edit enters existing recoverable editor; retained draft has explicit Resume draft on the detail page. Move to trash uses existing revision checks, draft protection, confirmation and relationship-impact preview; collection removal preserves the current view/search/sort and provides a notification with View Trash. Record-page removal retains the existing transition to Trash. No permanent deletion or independent update path.

Relationship editor adds multi-term filtering by title, ID, type and tags. Only compatible, non-self, nonduplicate targets remain selectable; display up to 50 matches with explicit count and refine-search hint. Keep relationship types, canonical storage and legacy edges unchanged. No dependency changes. Existing browser tests updated for action menus and two additional scenarios cover menu keyboard behavior, focus, removal with retained context and relationship search/saving. Thirteen scenarios in the intermediate slice. The owner reported both gates passed; see the evidence below. PR #11 is expanded into record-management-increment, not accepted as a separate small PR.

## Intermediate verification
Owner confirmed the npm and browser gates passed at intermediate PR #11 head 3775a7ae79a111f0ec6be30e9abb44e90eff557e (reported in development chat, no detailed new report counts supplied). This is historical evidence for the menu/relationship slice only. The expanded PR requires fresh exact-revision verification and one combined UX acceptance. No merge approval has been given for PR #11.


## Integration outcome
Owner confirmed both automated gates and all manual acceptance checks passed for PR #11 and explicitly approved merging on 2026-11-24. Tested topic head: b625b1986a69159d8d0f6a0fc2c00d237899188c. Regular merge: c96c5c728acfbcc64953d8e1e94579bd44dfcc30. See [PR #11](https://github.com/aschenrot/prism/pull/11). Owner-reported acceptance; individual case observations and local run JSON were not supplied. This is historical evidence, not verification of the public-preview integration candidate.

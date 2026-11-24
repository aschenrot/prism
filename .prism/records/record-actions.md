---
id: record-actions
type: Task
title: Unify record actions and searchable relationship selection
status: In progress
priority: High
accent: teal
tags: [current, design, usability, implementation]
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

Relationship editor adds multi-term filtering by title, ID, type and tags. Only compatible, non-self, nonduplicate targets remain selectable; display up to 50 matches with explicit count and refine-search hint. Keep relationship types, canonical storage and legacy edges unchanged. No dependency changes. Existing browser tests updated for action menus and two additional scenarios cover menu keyboard behavior, focus, removal with retained context and relationship search/saving. Thirteen minimum browser scenarios; verification pending. Inline property editing, evidence-aware acceptance summaries, bulk operations and configurable tables remain next scope.

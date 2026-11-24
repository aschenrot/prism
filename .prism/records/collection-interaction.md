---
id: collection-interaction
type: Task
title: Unify collection controls and safe record management
status: Concept
priority: High
accent: teal
tags: [planned, design, usability]
relationships:
  - management-views
  - ux-navigation
  - data-integrity
  - editing-reliability
  - knowledge-engine
---
Owner feedback: improve sort options with ascending/descending; cannot delete after opening a record; cannot edit directly in Table; new-record action should not sit in global navigation; search should be on the left. Source review at 86b8578 confirmed limitations. Keep this a separate focused increment after PR #9 is verified; no collection changes claimed in the current editor patch.

Acceptance direction: shared collection toolbar with left search and contextual creation; deterministic sort and direction with sortable headings and backward-compatible saved views; direct edit actions across collection modes; reversible delete/trash/restore with inbound relationship impact and revision checks. Never silently overwrite existing drafts or lose linked evidence. Fix filtered reader selection, contextual record creation, and stale asynchronous saved-view navigation. Follow-up: inline fields, searchable relationships, evidence-aware acceptance summaries, multi-select/bulk operations, column customization, keyboard-accessible board drag/drop, global search and command palette. Automated regression coverage required.

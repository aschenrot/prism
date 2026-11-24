---
id: collection-interaction
type: Task
title: Unify collection controls and safe record management
status: In progress
priority: High
accent: teal
tags: [current, design, usability, implementation]
relationships:
  - management-views
  - ux-navigation
  - data-integrity
  - editing-reliability
  - knowledge-engine
  - collection-acceptance
---
Owner feedback: improve sort options with ascending/descending; cannot delete after opening a record; cannot edit directly in Table; new-record action should not sit in global navigation; search should be on the left. Source review at 86b8578 confirmed limitations. PR #9 accepted and merged; branch feat/collection-interaction is based on the regular merge commit.

Acceptance direction: shared collection toolbar with left search and contextual creation; deterministic sort and direction with sortable headings and backward-compatible saved views; direct edit actions across collection modes; reversible delete/trash/restore with inbound relationship impact and revision checks. Never silently overwrite existing drafts or lose linked evidence. Fix filtered reader selection, contextual record creation, and stale asynchronous saved-view navigation. Follow-up: inline fields, searchable relationships, evidence-aware acceptance summaries, multi-select/bulk operations, column customization, keyboard-accessible board drag/drop, global search and command palette. Automated regression coverage required.

## Implementation
Shared collection toolbar: left search with token matching and clear, compact filters, explicit sort field and direction, contextual New action. Legacy saved views without direction retain Priority high-first, others ascending. Table headings toggle sort; direction stored with view/history. Direct Edit in Table, Board, Gallery, Wiki, Relationships and Slides uses the same draft-protected editor. Typed collections lock creation to the applicable type, new records open directly in editing. Wiki reader follows filtered visible records. Saved-view mutation completion checks navigation scope before applying results. Record pages offer Move to trash with relationship impact warning and local recovery checks; Trash restores original file/ID using revision checks and exclusive no-overwrite hard link. No permanent deletion. Trash is canonical Git-trackable data, not a cache; links and acceptance evidence remain unchanged. Filesystems without hard links fail safely. No distributed locking; external races may require inspecting Trash. Inline property editing, bulk operations, table customization, board drag/drop, searchable relationships and evidence rollups remain later scope. Three new browser scenarios and sorting/trash tests written; actual verification pending.

---
id: collection-acceptance
type: Test
title: User acceptance — collection interactions
status: Ready
priority: High
accent: teal
tags: [acceptance, quality]
relationships:
  - collection-interaction
  - knowledge-engine
  - quality-gates
  - kind: verifies
    target: data-integrity
---
## Review instructions
Run npm run verify and npm run test:browser on the clean proposed collection-interaction revision. Existing editor browser regressions remain mandatory; three new scenarios cover toolbar sorting and direct edit, reader filtering and board actions, and recoverable trash. Manual review focuses on usability. Use only disposable records in Starter workspace or an isolated scratch project; never move actual planning records or assets to trash for testing. Record actual results, notes for failures/blocks, and copy review summary after review. Do not infer acceptance from test automation or merge automatically.

## U. Collection experience
- [ ] U01 — **Find and organize records** — Open Work and switch between Table and Board. Try the left search, filter controls, sort field, direction and sortable table headers; navigate away and Back. Expected: controls are clear and consistent, sorting predictable, header spacing stable, Created/Last edited ordering clear and previous context retained.
- [ ] U02 — **Create and edit directly** — In a disposable project use contextual New and direct Edit actions in Table, Board or Wiki; cancel a change and inspect the saved record. Expected: no unnecessary intermediate page, correct record type, easy access to editing and predictable return.
- [ ] U03 — **Remove and restore safely** — On a disposable linked record choose Move to trash, inspect the in-app confirmation, cancel once, then move and restore it from Trash. Expected: the dialog is readable, impact is understandable, record disappears from active collections and restoration retains original identity and content; links remain intact.

## Results
Accepted PR #10: owner confirmed both automated gates and the UX passed after final polish head 79c95b609992d98be902f56f5d49d8092d7cce6e, explicitly approved regular merge and continued development on 2026-11-24. Final detailed report counts were not supplied. Merge a9d5ca8759ec13ff1fc37179a88368047d4eb126 preserves the identical accepted file tree. This is owner-reported historical acceptance, not evidence for subsequent changes.

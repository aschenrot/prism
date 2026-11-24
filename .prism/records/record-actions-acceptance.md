---
id: record-actions-acceptance
type: Test
title: User acceptance — record actions and relationships
status: In progress
priority: High
accent: teal
tags: [current, acceptance, quality]
relationships:
  - record-actions
  - knowledge-engine
  - quality-gates
  - kind: verifies
    target: data-integrity
---
## Review instructions
Run npm run verify and npm run test:browser on the clean proposed revision. The browser suite includes prior regressions and two additional scenarios. Use only disposable records in Starter workspace or a scratch project. Record actual observations and copy the saved review summary. Do not infer manual acceptance from automated evidence.

## U. Interaction review
- [ ] U01 — **Use consistent record actions** — Open the ellipsis in Table, Board and a record page; navigate menu items with keyboard, choose Edit and use Move to trash on a disposable record, cancel once, then confirm and restore. Expected: compact consistent controls, no clipping or row navigation on menu click, clear focus, predictable dismissal and retained collection context; recovery and confirmation protection remain.
- [ ] U02 — **Find a relationship target** — Open a disposable task editor, choose Implements, search for a known requirement by title or ID, add it and save. Try a query with no compatible matches. Expected: easy target discovery, clear match count, incompatible or duplicate targets excluded and existing links preserved.

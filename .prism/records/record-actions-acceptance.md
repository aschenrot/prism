---
id: record-actions-acceptance
type: Test
title: User acceptance — record management
status: Ready
priority: High
accent: teal
tags: [acceptance, quality]
relationships:
  - record-actions
  - record-management-increment
  - knowledge-engine
  - quality-gates
  - kind: verifies
    target: data-integrity
---
## Review instructions
Run npm run verify and npm run test:browser on the clean proposed revision. The browser suite includes sixteen scenarios (the earlier thirteen plus inline/bulk properties, duplication/link copying, and increment scope). Use only disposable records in Starter workspace or a scratch project. Record actual observations and copy the saved review summary. Do not infer manual acceptance from automated evidence.

## U. Interaction review
- [ ] U01 — **Use consistent record actions** — Open the ellipsis in Table, Board and a record page; navigate menu items with keyboard, choose Edit and use Move to trash on a disposable record, cancel once, then confirm and restore. Expected: compact consistent controls, no clipping or row navigation on menu click, clear focus, predictable dismissal and retained collection context; recovery and confirmation protection remain.
- [ ] U02 — **Find a relationship target** — Open a disposable task editor, choose Implements, search for a known requirement by title or ID, add it and save. Try a query with no compatible matches. Expected: easy target discovery, clear match count, incompatible or duplicate targets excluded and existing links preserved.

- [ ] U03 — **Edit properties and multiple records** — Use a disposable collection to change status and priority inline, select several visible records, inspect the bulk preview and apply one property. Expected: no row navigation, clear selection scope, truthful results and preserved unrelated properties and recovery drafts; filter changes clear selection.
- [ ] U04 — **Duplicate and share a record** — Duplicate a saved disposable record and copy its stable link. Expected: independent Concept record, copied content, no inherited completion/relationships, accessible link and original record unchanged.
- [ ] U05 — **Review the delivery increment** — Open Increments and Record management and interaction, follow a scoped task and the acceptance test, and inspect local npm/browser evidence. Expected: clear separation of authored task status, linked changes, current/historical automated results and acceptance decision; no implied completion from commits or old evidence.

## Results
Owner confirmed both automated gates and all manual acceptance checks passed for PR #11 and explicitly approved merging on 2026-11-24. Tested topic head: b625b1986a69159d8d0f6a0fc2c00d237899188c. Regular merge: c96c5c728acfbcc64953d8e1e94579bd44dfcc30. See [PR #11](https://github.com/aschenrot/prism/pull/11). Owner-reported acceptance; individual case observations and local run JSON were not supplied. This is historical evidence, not verification of the public-preview integration candidate.

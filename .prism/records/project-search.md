---
id: project-search
type: Task
title: Project-wide canonical record and file search
status: In progress
priority: High
accent: teal
tags: [search, knowledge, product]
relationships:
  - search-index
  - knowledge-engine
  - kind: depends-on
    target: configurable-table-columns
---
Data library Search mode provides explicit project-wide lookup of saved active records and allowed repository paths and text. Record search includes title, ID, type, tags, body, status and typed property label/value/reference title; matching terms may occur across fields. Deterministic weighted ranking, matched-field excerpts, bounded result counts, source paths, read-only file preview, isolated project scope and Back/Forward query context. Read current data on each submitted search; no persistent index, external request, draft/trash indexing or duplicate canonical data. Repository limits: existing path allowlist, at most 400 content attempts and 8 MiB of read content, preview limit and incomplete counts; all indexed paths remain eligible. Record errors and unavailable schemas explicit. Test scope, ranking, provenance, limits and navigation. Persistent indexing only after measurement; templates and inbox separate. Owner acceptance K07 pending.


Technical integration: PR #20 merged at d2dfe3c3ed126e413a3132678bea2d9a6f977fba; final run 45457808408 passed all four hosted configurations, 77 unit and 23 browser scenarios per job at checkout 6f512390ad05cbc5dbf069f8d0de13e1b531da8a, identical tree to head bdfbef19dd2dea711fc89eb3f3f716ef41a6ec09. Clean eligible evidence, no failed/flaky/skipped tests and zero reported audit vulnerabilities. Human K07 acceptance pending.
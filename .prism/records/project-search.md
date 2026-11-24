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

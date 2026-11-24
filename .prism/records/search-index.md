---
id: "search-index"
type: "Feature"
title: "Unified search and capture"
status: "In progress"
priority: "Normal"
accent: "amber"
tags: ["product","knowledge"]
relationships: ["knowledge-engine","storage"]
---
Universal inbox and templates; search records, docs and source with a rebuildable SQLite/FTS5 index when measurements justify it. Keep index derived, versioned and disposable. Include keyboard access and understandable result provenance.


First search slice: see project-search. Build a bounded read-on-demand projection from canonical saved records and allowed repository files; no persistent database yet. Explicit matched fields and incomplete scan counts, isolated project scope. Templates and inbox follow separately.

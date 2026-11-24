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


Reusable record templates: see record-templates. Separate versioned project-owned definitions; validated application into independent records. Inbox triage remains separate.


Technical integration: PR #20 merged at d2dfe3c3ed126e413a3132678bea2d9a6f977fba; final run 45457808408 passed all four hosted configurations, 77 unit and 23 browser scenarios per job at checkout 6f512390ad05cbc5dbf069f8d0de13e1b531da8a, identical tree to head bdfbef19dd2dea711fc89eb3f3f716ef41a6ec09. Clean eligible evidence, no failed/flaky/skipped tests and zero reported audit vulnerabilities. Human K07 acceptance pending.

Project inbox: see inbox-capture. Capture and triage operate on the canonical record, not on a separate store.

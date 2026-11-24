---
id: "storage"
type: "System"
title: "Canonical record and view storage"
status: "Ready"
priority: "High"
accent: "violet"
tags: ["architecture","storage","implemented"]
relationships: ["data-integrity","editing-reliability"]
---
Implementation: server/store.ts, server/views.ts and shared/records.ts. Validated Markdown records and versioned YAML views are project-scoped. Optimistic SHA-256 revision checks and atomic replacement protect normal single-process writes. No guarantee of multi-file transactions or external-process isolation. Verified by previously reported local tests; further recovery work is tracked separately.

---
id: "data-integrity"
type: "Requirement"
title: "Preserve authored data and detect conflicts"
status: "In progress"
priority: "High"
accent: "rose"
tags: ["quality","requirement"]
relationships: ["storage","editing-reliability","quality-gates"]
---
Acceptance: reject stale saves; preserve unrecognized metadata; never overwrite authored data during indexing or generation; retain recoverable drafts; report invalid files clearly; provide independent backups. Existing revision checks and schema tests cover part of this requirement; autosave, crash recovery and multi-record changes remain open.

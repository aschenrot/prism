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


M1 filesystem boundary hardening: enforce disjoint project data directories for all registry sources before opening any stores; protect interrupted backups against verification and writable project opening. Local-only, offline command assumptions remain. See m1-filesystem-hardening.

---
id: "editing-reliability"
type: "Feature"
title: "Reliable editing, drafts and recovery"
status: "In progress"
priority: "High"
accent: "amber"
tags: ["roadmap","foundation"]
relationships: ["data-integrity","knowledge-engine","draft-recovery"]
---
Implement command-based undo/redo, draft persistence and recovery, autosave with revision conflicts, archive/delete, bulk changes, backup/restore and explicit versioned migrations. Replace repeated whole-project polling with an incremental watcher when justified. Acceptance: crash/restart does not silently discard drafts, external changes never silently overwrite user work.

First slice: browser-local recovery and explicit field-level conflict resolution with revision checks retained. Undo/redo, autosave to canonical records, durable filesystem drafts, orphan-draft management and backups are follow-up work. See draft-recovery.


Draft command history: see draft-command-history. Bounded session-local undo/redo, persisted current recovery draft, no undo across canonical saves or external conflict review. Canonical autosave and backups remain separate.


Opt-in canonical autosave: see opt-in-autosave. Off per editor session, validated idle commit using the existing revision and recovery boundary; no blind conflict retry. Backups remain separate.

Local project backups: see local-project-backups. Explicit CLI, exact-byte verification, non-destructive new-directory restore; no browser filesystem path input.


Recovery workspace: see recovery-workspace. Expose stored browser-local drafts even after their canonical files become unavailable. Export, restore canonical file and review, or explicitly discard with the same recovery token guard. Filesystem-backed draft storage remains a separate architecture decision.

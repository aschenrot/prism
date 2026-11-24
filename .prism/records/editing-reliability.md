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

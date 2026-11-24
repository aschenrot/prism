---
id: "editing-reliability"
type: "Feature"
title: "Reliable editing, drafts and recovery"
status: "Concept"
priority: "High"
accent: "amber"
tags: ["roadmap","foundation"]
relationships: ["data-integrity","knowledge-engine"]
---
Implement command-based undo/redo, draft persistence and recovery, autosave with revision conflicts, archive/delete, bulk changes, backup/restore and explicit versioned migrations. Replace repeated whole-project polling with an incremental watcher when justified. Acceptance: crash/restart does not silently discard drafts, external changes never silently overwrite user work.

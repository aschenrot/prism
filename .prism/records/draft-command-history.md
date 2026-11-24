---
id: draft-command-history
type: Task
title: Bounded record draft undo and redo
status: In progress
priority: High
accent: amber
tags: [editing, reliability]
relationships:
  - editing-reliability
  - draft-recovery
  - knowledge-engine
  - m1-milestone-acceptance
---
Record-editor undo and redo operate on immutable unsaved draft snapshots, with bounded in-memory history and coalesced typing groups. Native keyboard commands plus explicit controls; each step uses the same recovery persistence and keeps the original revision. New edits invalidate redo; save, discard, reload, clean external refresh and explicit conflict/schema review reset history. No history of committed canonical writes; current draft recovery still persists independently. Test history boundaries, grouping, keyboard, recovery and canonical save. Owner K13 pending.

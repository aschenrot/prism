---
id: recovery-workspace
type: Task
title: Project-scoped recovery inventory and orphan rescue
status: In progress
priority: High
accent: teal
tags: [editing, reliability]
relationships: [editing-reliability, draft-recovery, data-integrity, m1-milestone-acceptance]
---
Expose browser-local recovery drafts for the selected project, including unavailable canonical records and unreadable copies. Inventory is bounded and reports incomplete/unavailable storage, paginates stable IDs, and refreshes on storage changes. Review existing records through the normal editor; explicitly export a copy (including raw invalid data) or discard after confirmation and token comparison. No silent canonical writes, no server drafts, no cross-device guarantee. Human K18 pending.

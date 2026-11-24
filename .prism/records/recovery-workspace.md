---
id: recovery-workspace
type: Task
title: Project-scoped recovery inventory and orphan rescue
status: In progress
priority: High
accent: teal
tags: [editing, reliability]
relationships:
  - kind: implements
    target: editing-reliability
  - draft-recovery
  - kind: implements
    target: data-integrity
  - m1-milestone-acceptance
---
Expose browser-local recovery drafts for the selected project, including unavailable canonical records and unreadable copies. Inventory is bounded and reports incomplete/unavailable storage, paginates stable IDs, and refreshes on storage changes. Review existing records through the normal editor; explicitly export a copy (including raw invalid data) or discard after confirmation and token comparison. No silent canonical writes, no server drafts, no cross-device guarantee. Human K18 pending.

Integration evidence: PR #31 merged at `1856444a1c8e79737b33dd895cb3aa820cfdd0f0`. [Verify 45482796406](https://github.com/aschenrot/prism/actions/runs/45482796406): all four configurations passed 96 unit and 32 browser scenarios each, zero failures/skips/flakes, clean exact checkout and zero audit vulnerabilities. Human acceptance remains pending.

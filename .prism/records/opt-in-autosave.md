---
id: opt-in-autosave
type: Task
title: Opt-in revision-safe canonical autosave
status: In progress
priority: High
accent: amber
tags: [editing, reliability]
relationships:
  - editing-reliability
  - draft-command-history
  - knowledge-engine
  - m1-milestone-acceptance
---
Autosave is off for each new editor session, including resumed recovery. Explicit opt-in saves valid dirty drafts after 1.8 seconds idle while the tab is visible, through the same validation and expected record/schema revision command as manual Save. Require confirmed current recovery token. Invalid input remains a draft; unavailable canonical data, conflicts, stale schema or unconfirmed recovery pause autosave, no blind retry. Conflict/schema review and discard require new opt-in; successful save resets draft undo history. Keep manual Save/Keep draft and explicit error states. Unit and isolated browser verification. Owner K14 pending.


PR #27 integrated at 66f975d9fd3e703bb7bceff16a011d47f739144b. Run 45479027177: 86 unit + 30 browser scenarios per configuration, four configurations, zero failed/flaky/skipped, clean eligible evidence and zero reported audit vulnerabilities. Checkout 33f16cb774c9d85943443e74766574f1a132178a, identical tree to proposed head. K14 human review pending.

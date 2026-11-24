---
id: local-project-backups
type: Task
title: Verified local project backup and non-destructive restore
status: In progress
priority: High
accent: teal
tags: [reliability, recovery]
relationships:
  - kind: implements
    target: editing-reliability
  - kind: implements
    target: data-integrity
  - m1-milestone-acceptance
---
Add explicit local backup, verify and restore commands with a versioned SHA-256 manifest, bounded allowlisted data inventory and new-directory-only restore. Preserve exact bytes including unknown metadata and trash. Exclude registry paths, caches, Git history and browser drafts. Refuse symlinked stores, unsafe paths and incomplete restores. Document offline operation and non-transactional limitations. Acceptance: K15; technical verification and human review pending.

Safety review: reject incorrect source roots without a real records directory and reject opening a backup manifest directory as a live project. Preserve empty records directories in backups and restores, flush copied file writes. Add regression for wrong roots, actual empty projects and backup-as-project. Fresh matrix required.


PR #28 integrated at 7fef8371dc50f2c22bd63893b57d7ede26365971. Run 45479915600: 91 unit + 30 browser scenarios per configuration, four configurations, zero failed/flaky/skipped, clean eligible evidence and zero reported audit vulnerabilities. Checkout c5a1771e6c942c7b4c84b5271a704ee8a10700ef, identical tree to proposed head. Backup safety regressions observed. K15 human review pending.

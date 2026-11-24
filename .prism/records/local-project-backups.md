---
id: local-project-backups
type: Task
title: Verified local project backup and non-destructive restore
status: In progress
priority: High
accent: teal
tags: [reliability, recovery]
relationships: [editing-reliability, data-integrity, m1-milestone-acceptance]
---
Add explicit local backup, verify and restore commands with a versioned SHA-256 manifest, bounded allowlisted data inventory and new-directory-only restore. Preserve exact bytes including unknown metadata and trash. Exclude registry paths, caches, Git history and browser drafts. Refuse symlinked stores, unsafe paths and incomplete restores. Document offline operation and non-transactional limitations. Acceptance: K15; technical verification and human review pending.

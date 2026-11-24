---
id: git-evidence-slice
type: Task
title: Read Git-linked work evidence
status: In progress
priority: High
accent: teal
tags: [current, implementation, engineering]
relationships:
  - kind: implements
    target: delivery-evidence
  - kind: implements
    target: git-intelligence
  - self-management
---
Acceptance: Changes displays the latest 100 commits reachable from captured local HEAD; explicit Prism-Record trailers and reviewed exact historical hashes associate commits with stable record IDs; Work, Overview and record details display derived delivery evidence without mutating authored status. Unlinked and unresolved references remain visible. Nested Emberfall without independent Git metadata does not inherit Prism history. No Git writes, shell execution, remote fetch or automatic acceptance. Tests: tests/git.test.ts. Verify on Windows and Linux; no CI success claimed.

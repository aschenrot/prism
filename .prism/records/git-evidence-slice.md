---
id: git-evidence-slice
type: Task
title: Read Git-linked work evidence
status: Ready
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

Owner-reported Windows local run after c6a423f: both Git-specific tests passed (explicit trailer parsing and root-scoped history). Manual UI acceptance remains pending; the overall typecheck/build gate failed in a separate component. See local-verification.

## Foundation acceptance
Owner explicitly accepted foundation PR #1. Local verification passed at 859efb773d22544fed85567e01f4623d35f788d0 on Windows, Node 26.13.1: locked install, typecheck, 27 tests passed / one expected file-symlink permission skip, production build and both audits (zero vulnerabilities). Regular merge commit 156700abada6ec691e5fb0e7e4225cc2fffe9af0 has the same tree as the tested head. This is evidence of the accepted baseline, not verification of later editor changes.

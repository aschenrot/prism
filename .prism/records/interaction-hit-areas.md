---
id: interaction-hit-areas
type: Task
title: Fix project selector and table-row hit areas
status: Ready
priority: High
accent: rose
tags: [current, design, usability]
relationships:
  - kind: implements
    target: ux-navigation
  - visual-quality
  - self-management
implementationCommits: ["bdfa7d32989b313b7fcf23bb294610527262c43c"]
---
Owner feedback: only specific sub-elements of the project selector and table rows are clickable. Source review confirms a small native select nested in a larger visual container and a title-only table button.

## Acceptance
- Click the project card icon, title, subtitle or empty padding: the native project picker opens when enabled.
- When switching is blocked by editing or creation, display the reason.
- Click title, type, status, priority or whitespace in a table row: select the same record.
- Tab to the row title and use Enter or Space to select it; keep semantic table markup, a visible focus state and selected feedback.
- Preserve the unsaved-edit guard and project isolation. Verify pointer and keyboard interaction at normal and narrow window widths.

Implementation committed with this record. Browser and acceptance verification remain outstanding.

## Foundation acceptance
Owner explicitly accepted foundation PR #1. Local verification passed at 859efb773d22544fed85567e01f4623d35f788d0 on Windows, Node 26.13.1: locked install, typecheck, 27 tests passed / one expected file-symlink permission skip, production build and both audits (zero vulnerabilities). Regular merge commit 156700abada6ec691e5fb0e7e4225cc2fffe9af0 has the same tree as the tested head. This is evidence of the accepted baseline, not verification of later editor changes.

---
id: interaction-hit-areas
type: Task
title: Fix project selector and table-row hit areas
status: In progress
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

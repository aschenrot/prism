---
id: board-status-movement
type: Task
title: Accessible revision-safe board status movement
status: In progress
priority: High
accent: amber
tags: [management, interaction]
relationships:
  - management-views
  - knowledge-engine
  - m1-milestone-acceptance
---
Use dedicated native drag handles and a keyboard/touch-operable Move to control on board cards. Cross-column movement uses the same expected-revision property command, recovery guard, confirmed result and refresh as table property edits. Do not optimistically relocate records, persist manual order, bypass filters or invent workflow states. Focus returns to the moved control when it remains visible, or the board if filters exclude it. External drops and same-column drops do not modify records. Browser coverage includes pointer movement, keyboard alternative, stale revision, protected draft and retained filters. Owner K10 pending.

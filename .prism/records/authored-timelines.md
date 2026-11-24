---
id: authored-timelines
type: Task
title: Authored calendar timelines with reusable field mappings
status: In progress
priority: High
accent: amber
tags: [management, planning, views]
relationships:
  - management-views
  - knowledge-engine
  - dependency-planning
  - m1-milestone-acceptance
---
Timeline mode projects selected active date properties as single markers or inclusive ranges. Save stable start/end property IDs with the view and retain mappings in navigation context. Use authored calendar dates only; missing, invalid, reversed and inactive fields are explicitly unplotted, retired/unavailable mappings remain selected but do not interpret values. No automatic scheduling, critical path computation or inferred dates. Edit through the canonical editor. Unit and isolated browser verification, including saved mapping and retirement. Owner K12 pending.


PR #25 integrated at bb9824746bb1c0f5e4f24ec24169f6fac1c3b1aa. Run 45466999001: 83 unit + 28 browser scenarios per configuration, four configurations, zero failed/flaky/skipped, clean eligible evidence and zero audit vulnerabilities. Checkout b752f1ae3a6e651ac56347b6c886a8aa5cb41041, identical tree to proposed head. K12 human review pending.

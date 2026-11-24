---
id: dependency-planning
type: Task
title: Explicit dependency planning and cycle visibility
status: In progress
priority: High
accent: amber
tags: [management, planning]
relationships:
  - management-views
  - knowledge-engine
  - m1-milestone-acceptance
---
Plan mode for Work, Roadmap, Increments and Data library. Normalize depends-on and blocks into directed prerequisite edges, deduplicate equivalent assertions, display direct known and unavailable prerequisites/dependents, flag exact strongly connected cycle members, and preserve links outside current filters. No inferred relationships, transitive scheduling or automatic status changes. Ready means authored status, not acceptance. Plan supports normal filtering, stable links and saved views. Tests include edge direction, cycles, long graph, project context and browser navigation. Owner K11 pending.

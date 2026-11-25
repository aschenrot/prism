---
id: local-project-registration
type: Task
title: Safe local project registration and settings
status: In progress
priority: High
accent: teal
tags: [management, configuration]
relationships:
  - kind: implements
    target: project-settings
  - project-registry
  - knowledge-engine
  - m1-milestone-acceptance
---
Provide local list/add/settings commands, keeping existing default project entries and explicit override precedence. Validate existing folders, stable project IDs, canonical roots and disjoint data stores. No browser filesystem paths, root reassignment, destructive removal or implicit registry migration. Publish only the ignored local registry with guarded offline writes. Restart and use the existing project switcher. Test startup, isolated record stores, settings persistence, conflicts and malformed registry rejection. Human K16 pending.


PR #29 integrated at 1e23237ada57af271b73720ab96ce651ab92f7a3. Run 45480891681: 94 unit + 30 browser scenarios per configuration, four configurations, zero failed/flaky/skipped, clean eligible evidence and zero reported audit vulnerabilities. Checkout 8e87dc02015f354b96ef416fd4ce2a9a4ef6a2d4, identical tree to proposed head. K16 human review pending. Startup enforcement of disjoint stores is a follow-up.


The guided Create project, Connect existing project and Manage projects entries use these same CLI commands. They do not invoke the shell or grant filesystem access. See m1-task-first-workspace.

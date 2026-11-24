---
id: "management-views"
type: "Feature"
title: "Roadmaps, dependency planning and traceability"
status: "Concept"
priority: "High"
accent: "amber"
tags: ["product","management"]
relationships: ["knowledge-engine","typed-relationships"]
---
Support timelines, milestones, task dependencies, prioritization, requirements matrices, project status reports and distinct product/project perspectives. Determine ownership before integrating GitHub Issues to avoid duplicate task status. Start from real dogfood needs; do not add chart types without clear source semantics.


First board movement slice: board-status-movement. Cross-column status commands reuse the canonical write path; manual per-column order and dependency scheduling are separate. Do not infer acceptance from movement to Ready.


Dependency planning: see dependency-planning. A derived projection of explicit links, with direct prerequisite status and exact cycle membership. Timeline dates will use configured authored date fields rather than inferred schedules.


Authored timelines: see authored-timelines. Explicit date property mapping, reusable saved views and no inferred schedule; automatic dependency scheduling remains outside this slice.

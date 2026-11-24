---
id: configurable-table-columns
type: Task
title: Configurable table columns and saved presentation
status: In progress
priority: High
accent: teal
tags: [views, schema, product]
relationships:
  - project-property-increment
  - kind: implements
    target: views-engine
  - kind: implements
    target: custom-schemas
  - kind: depends-on
    target: custom-entity-types
---
Implement optional ordered table columns using stable built-in and property IDs. Keep title, selection and actions present; preserve legacy defaults, fixed column geometry, inline status and priority commands, collection filters and record navigation. Save presentation with view definitions and preserve it in history. Display inactive, retired or unavailable property values without rewriting data. Provide keyboard-operable reorder, hide, add and reset. Custom columns are read-only in this slice; typed editing remains in the record editor, and custom sorting/filtering is future work. Verify unit persistence, validation, history and typed value formatting plus isolated browser scenario. Consolidated owner review K06 remains pending.


Technical integration: PR #19 merged at 2bd43b77021ad0be9cb424e1b79501caea7acbd1; final run 45457077297 passed all four hosted configurations, 75 unit and 22 browser scenarios per job at checkout 06f48aaab15aa39642f8bd43dd4c8172a3ca521d, identical tree to head d5dae9638d01a6905c009c7ce859282b842c1ac2. Clean eligible evidence, no failed/flaky/skipped tests and zero reported audit vulnerabilities. Human K06 acceptance pending.
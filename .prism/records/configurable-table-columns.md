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
  - views-engine
  - custom-schemas
  - kind: depends-on
    target: custom-entity-types
---
Implement optional ordered table columns using stable built-in and property IDs. Keep title, selection and actions present; preserve legacy defaults, fixed column geometry, inline status and priority commands, collection filters and record navigation. Save presentation with view definitions and preserve it in history. Display inactive, retired or unavailable property values without rewriting data. Provide keyboard-operable reorder, hide, add and reset. Custom columns are read-only in this slice; typed editing remains in the record editor, and custom sorting/filtering is future work. Verify unit persistence, validation, history and typed value formatting plus isolated browser scenario. Consolidated owner review K06 remains pending.

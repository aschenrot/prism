---
id: property-schema-management
type: Task
title: In-app schema administration and configurable entity types
status: Concept
priority: High
accent: amber
tags: [knowledge, product]
relationships:
  - kind: implements
    target: custom-schemas
  - kind: depends-on
    target: property-schema-foundation
  - project-property-increment
  - m1-milestone-acceptance
---
Provide project-scoped schema editing with explicit revision checks, usage awareness, safe field/option renaming, non-destructive deprecation, and clear impact preview. Design custom record type identity independently of built-in Task, Test, Milestone and Increment semantics; avoid rewriting old records or breaking saved views. Schema migration that removes or converts values requires separate owner-approved review. Preserve stable IDs and avoid arbitrary code. Refine implementation scope before coding.

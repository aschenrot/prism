---
id: project-property-increment
type: Increment
title: Configurable project schemas and properties
status: In progress
priority: High
accent: teal
tags: [current, knowledge, product]
relationships:
  - knowledge-engine
  - custom-schemas
  - kind: contains
    target: property-schema-foundation
  - kind: contains
    target: property-schema-management
  - kind: contains
    target: custom-entity-types
  - kind: contains
    target: configurable-table-columns
  - kind: contains
    target: m1-milestone-acceptance
---
Build a backward-compatible configurable schema engine in vertical slices. Start with project-specific typed optional properties for built-in record types, revision-safe editing and readout. Follow with schema administration, custom record types and configurable views. Keep existing record IDs, built-in semantics, typed relationships and recovery intact. No executable formulas, implicit migrations or data conversion. Final human acceptance is consolidated at M1.

Custom entity slice: stable project-defined entity IDs map to immutable built-in roles; optional record customTypeId plus entity-scoped properties, administration, recovery and collection filter. No implicit type conversion or breaking migration. Keep built-in semantic routes and existing saved views. Technical verification pending; see custom-entity-types.

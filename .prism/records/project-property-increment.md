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
    target: m1-milestone-acceptance
---
Build a backward-compatible configurable schema engine in vertical slices. Start with project-specific typed optional properties for built-in record types, revision-safe editing and readout. Follow with schema administration, custom record types and configurable views. Keep existing record IDs, built-in semantics, typed relationships and recovery intact. No executable formulas, implicit migrations or data conversion. Final human acceptance is consolidated at M1.

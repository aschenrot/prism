---
id: custom-entity-types
type: Task
title: Custom entity identities with built-in semantic roles
status: In progress
priority: High
accent: amber
tags: [current, knowledge, product]
relationships:
  - kind: implements
    target: custom-schemas
  - kind: depends-on
    target: property-schema-management
  - project-property-increment
  - m1-milestone-acceptance
---
Support project-defined stable custom entity type IDs, labels, immutable built-in role mappings and non-destructive retirement. Assign through the revision-aware record editor and preserve old draft/client compatibility; render identity, scope custom properties and filter collections by stable entity ID. Reject cross-role, missing and retired new assignments; retain existing retired records and inactive values. No destructive migration, implicit scope changes or duplication of property/evidence data. In-app type administration; role-based routes and relationship semantics unchanged. Tests cover schema transitions, store validation, recovery, legacy views and end-to-end admin/record/filter behavior. Technical verification and M1 human acceptance pending.

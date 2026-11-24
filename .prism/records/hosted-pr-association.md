---
id: hosted-pr-association
type: Task
title: Associate pull requests and job evidence with delivery increments
status: Concept
priority: High
accent: amber
tags: [quality, management]
relationships:
  - kind: implements
    target: delivery-evidence
  - kind: depends-on
    target: hosted-workflow-metadata
  - hosted-delivery-increment
  - ci-import
  - m1-milestone-acceptance
---
Design and implement explicit repository/PR association scoped to an increment, not guessed from titles or branch names. Present provider PR state and head separately from actual matrix job and checked-out revision evidence; preserve historical observations and indicate unavailable/incomplete data. Respect read-only network boundary and revision-checked authored writes. No credentials or remote mutations in the initial public adapter. No inferred manual acceptance. Define exact schema, coverage and migration approach before implementation.

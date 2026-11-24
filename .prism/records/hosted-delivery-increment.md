---
id: hosted-delivery-increment
type: Increment
title: Hosted delivery intelligence
status: In progress
priority: High
accent: teal
tags: [current, quality, management]
relationships:
  - ci-import
  - delivery-evidence
  - knowledge-engine
  - kind: contains
    target: hosted-workflow-metadata
  - kind: contains
    target: hosted-pr-association
  - kind: contains
    target: m1-milestone-acceptance
---
M1 increment: expose real GitHub evidence without duplicating authored planning or claiming completion. First slice: configured public workflow metadata in Quality, explicit refresh, source/run/revision provenance and safe failure states. Next slice: explicit PR association to delivery increments and matrix job evidence. No remote write access or automatic task completion. Integration requires the exact green hosted matrix and developer review. Shared consolidated M1 acceptance is intentionally deferred; only its hosted evidence cases relate to this increment. See development-workflow-decision for delegation and current integration blocker.

---
id: project-configuration-increment
type: Increment
title: Local project registration and filesystem safety
status: In progress
priority: High
accent: teal
tags: [delivery, management]
githubPullRequests: [{repository: aschenrot/prism, number: 29}, {repository: aschenrot/prism, number: 34}, {repository: aschenrot/prism, number: 39}]
relationships:
  - knowledge-engine
  - project-settings
  - project-registry
  - data-integrity
  - kind: contains
    target: m1-native-project-settings
  - kind: contains
    target: m1-native-workspace-creation
  - kind: contains
    target: m1-product-quality-corrections
  - kind: contains
    target: local-project-registration
  - kind: contains
    target: m1-filesystem-hardening
  - kind: contains
    target: m1-milestone-acceptance
---
Local shell authorization of existing project folders, stable project settings, disjoint data roots for all registry sources, and incomplete backup protection. Review K15–K16. No root remapping, unrestricted browser path endpoint or destructive migration.

Explicit scope and repository-qualified PR associations are authored planning data. PR status, current checks and human review must be observed independently. This shared Test record is the consolidated M1 review, not independent acceptance of each increment. No status change from CI.


Project selector discoverability is addressed by m1-task-first-workspace, owned by record-management-increment and linked to project-settings. Existing folder connection and CLI settings still require local authorization and restart. Managed native workspace creation is tracked separately in m1-native-workspace-creation.

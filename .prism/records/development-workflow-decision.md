---
id: development-workflow-decision
type: Decision
title: Local verification and short-lived development branches
status: Ready
priority: High
accent: violet
tags: [decision, process, current]
relationships:
  - self-management
  - local-verification
  - ci-verification
  - delivery-evidence
---
Owner confirmed hosted CI is unavailable because the private repository's allowance is exhausted. Adopt local automated checks and manual acceptance as the merge gate. Hosted CI is optional, manual only.

Prism owns internal tasks, requirements and milestones; Git owns history; GitHub pull requests own review and integration; GitHub Issues are optional external intake, not a duplicate backlog. main is the locally verified integration branch. Use short-lived feat/, fix/, refactor/, docs/ or chore/ branches after the foundation is accepted. Retain exact commit hashes and trailers through regular merge commits. Squash/rebase rewriting breaks current ancestry-based attribution. Repository merge settings must be adjusted by the owner before merging PR #1; no merge before local verification and approval. The decision is adopted; implementation readiness is tracked independently.

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

## Public preview follow-up (2026-11-24)
Owner selected AGPL-3.0-only and wants to move toward public CI. Prepare automatic public PR/main checks while retaining the private automatic-run guard. Local automated checks remain required until actual hosted verification and required checks are adopted; manual UX acceptance and explicit merge approval remain unchanged. See public-preview-readiness.

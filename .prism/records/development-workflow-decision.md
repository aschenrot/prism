---
id: development-workflow-decision
type: Decision
title: Revision-bound verification and delegated M1 integration
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

## Adopted M1 delegation (2026-11-24)
Owner approved delegated implementation, technical review and integration through M1, with consolidated milestone-level human product review. This supersedes local-only and individual owner approval for in-scope verified increments. Preserve PR review, exact tested revision and tree, full green hosted matrix, security review and regular merge history. No merge when checks fail, base/head changes without reverification, or protections prevent it. Escalate architecture/product direction, breaking or destructive migrations, security/licensing concerns, scope deviations and access blockers. Manual acceptance remains pending, not inferred. Outside M1 the standing authority ends. Required status checks on main must be configured by the owner; manually inspect current full matrix until enforcement is observed. See docs/development-workflow.md. The active Protect Main ruleset has required_linear_history and repository settings only permit merge commits; PR #13 regular merge rejected HTTP 405. Await owner settings correction without bypass. Stacked development is permitted but integration order remains explicit.

## Settings reconciliation
Owner corrected the repository ruleset; directly verified four mandatory status checks, strict base synchronization, no linear-history requirement and no bypass actors. Regular merges of PR #13 and #14 succeeded through protected PR endpoints. The earlier configuration blocker is resolved; preserve the rule set and continue in-scope M1 development. See ci-verification for observed revisions and run IDs.

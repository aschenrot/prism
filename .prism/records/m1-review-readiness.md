---
id: m1-review-readiness
type: Task
title: Consolidate M1 delivery scope and final review readiness
status: In progress
priority: High
accent: teal
tags: [quality, management, milestone]
relationships: [knowledge-engine, m1-milestone-acceptance, quality-gates, development-workflow-decision]
---
## Closure criteria
- Explicit Milestone → Increment → Task/Test scope, with repository-qualified PR references and one consolidated review definition. Review all seven increments; no omitted implementation tasks in recent work.
- Current full hosted matrix on protected main after sequential integration; inspect exact head/tree, previous and new test inventory, failures and dependency audits. Human review remains separate.
- Confirm one canonical requirement update propagates to relationship readers, traceability, table and search without copying records or rewriting related task/objective content. Isolated browser regression.
- Document delivered local workflows and explicit boundaries. No claims of unverified product acceptance or additional platform support.
- Final owner review is the existing Test m1-milestone-acceptance. Never prepopulate results; owner decision and tested revision remain in local acceptance run. Stop M1 scope expansion once closure gates are met. Obtain explicit direction before M2.

## Boundaries for this milestone
The M1 baseline includes constrained version-1 schemas and stable custom entity identities; non-destructive retirement instead of arbitrary conversion; reusable table presentation, typed values edited in the existing record editor; explicit built-in relationships; bounded search, templates and inbox; status movement, direct dependency planning, authored date timelines and requirements matrix; protected editor drafts and opt-in autosave; local backup/restore and registration; scoped hosted metadata and authored PR links. No executable formulas, custom relationship vocabularies, arbitrary destructive migrations, automatic scheduling, persisted manual card ordering, filesystem or cross-device draft synchronization, persistent search index, unrestricted browser folder access, private GitHub authentication or durable hosted artifact attestation. These boundaries preserve existing architectural decisions and do not imply broad feature/release acceptance. Further work requires evidence of need or separate product decisions. Remaining actual defect fixes are in scope.

---
id: m1-review-readiness
type: Task
title: Consolidate M1 delivery scope and final review readiness
status: In progress
priority: High
accent: teal
tags: [quality, management, milestone]
relationships: [knowledge-engine, m1-milestone-acceptance, quality-gates, development-workflow-decision, record-navigation, editor-acceptance, collection-interaction, collection-acceptance, public-preview-readiness, ci-verification]
---
## Closure criteria
- Explicit Milestone → Increment → Task/Test scope, with repository-qualified PR references and one consolidated review definition. Review all seven increments; no omitted implementation tasks in recent work.
- Current full hosted matrix on protected main after sequential integration; inspect exact head/tree, previous and new test inventory, failures and dependency audits. Human review remains separate.
- Confirm one canonical requirement update propagates to relationship readers, traceability, table and search without copying records or rewriting related task/objective content. Isolated browser regression.
- Document delivered local workflows and explicit boundaries. No claims of unverified product acceptance or additional platform support.
- Final owner review is the existing Test m1-milestone-acceptance. Never prepopulate results; owner decision and tested revision remain in local acceptance run. Stop M1 scope expansion once closure gates are met. Obtain explicit direction before M2.

## Boundaries for this milestone
The M1 baseline includes constrained version-1 schemas and stable custom entity identities; non-destructive retirement instead of arbitrary conversion; reusable table presentation, typed values edited in the existing record editor; explicit built-in relationships; bounded search, templates and inbox; status movement, direct dependency planning, authored date timelines and requirements matrix; protected editor drafts and opt-in autosave; local backup/restore and registration; scoped hosted metadata and authored PR links. No executable formulas, custom relationship vocabularies, arbitrary destructive migrations, automatic scheduling, persisted manual card ordering, filesystem or cross-device draft synchronization, persistent search index, unrestricted browser folder access, private GitHub authentication or durable hosted artifact attestation. These boundaries preserve existing architectural decisions and do not imply broad feature/release acceptance. Further work requires evidence of need or separate product decisions. Remaining actual defect fixes are in scope.

## Historical scope and current evidence
Earlier owner-accepted PRs #9–11 remain historical evidence: record-navigation, editor-acceptance, collection-interaction, collection-acceptance and record-actions-acceptance. Publication and required cross-platform verification are supporting infrastructure (PRs #12–13; public-preview-readiness and ci-verification), not new human acceptance of the product. The seven increments capture the coherent delivery scope from PR #11 and PRs #14–35; this closure task covers PR #36. Technical integration evidence remains revision-specific. Review the latest section of knowledge-engine and ci-verification rather than historical pending statements. Do not start the owner run until the entire candidate is on main and the final main matrix has passed.

## Dogfooding traceability reconciliation
Explicitly author Implements links for M1 tasks where their recorded implementation supports the linked feature/requirement; use Verifies links for the consolidated test's actual scope. Generic links outside the targeted edits retain their original meaning. No links attest execution; review results remain separate. Project settings and management views move from Concept to In progress because their implementation is integrated, not Ready. Recheck exact final main matrix before handoff.


## Owner review outcome (2026-11-24)
At verified main `3eda97b6b32ac3c98f3c5fb879f1e16e74efe652`, owner reported finalized Changes requested, run `011fd661-10c4-475e-9ddc-ffc30c22b6aa`, definition revision `2a195e11c4f8a468adc30ab05228fde3172107039f87cd0b92ddb9018c9f444f`: H01–H04 passed, R01 failed, 20 pending. Navigation search behavior blocked continuation; owner requested collapsible record sections and clearer instructions. These are historical observations, not current acceptance. See m1-acceptance-navigation-correction. M1 remains open.

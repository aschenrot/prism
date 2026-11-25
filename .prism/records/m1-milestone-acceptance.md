---
id: m1-milestone-acceptance
type: Test
title: Milestone acceptance — configurable knowledge and management
status: In progress
priority: High
accent: teal
tags: [acceptance, quality, milestone]
relationships:
  - kind: verifies
    target: ci-import
  - kind: verifies
    target: delivery-evidence
  - kind: verifies
    target: custom-schemas
  - kind: verifies
    target: typed-relationships
  - kind: verifies
    target: editing-reliability
  - kind: verifies
    target: project-settings
  - kind: verifies
    target: management-views
  - kind: verifies
    target: search-index
  - kind: verifies
    target: data-integrity
  - kind: verifies
    target: visual-quality
  - knowledge-engine
  - hosted-delivery-increment
  - hosted-workflow-metadata
  - hosted-pr-association
  - hosted-reference-authoring
  - project-property-increment
  - property-schema-foundation
  - custom-entity-types
  - configurable-table-columns
  - project-search
  - record-templates
  - inbox-capture
  - board-status-movement
  - dependency-planning
  - authored-timelines
  - draft-command-history
  - opt-in-autosave
  - local-project-backups
  - local-project-registration
  - requirements-traceability
  - recovery-workspace
  - definition-form-recovery
  - m1-filesystem-hardening
  - m1-review-readiness
  - m1-acceptance-navigation-correction
  - m1-functional-verification
  - m1-task-first-workspace
  - knowledge-workflow-increment
  - management-planning-increment
  - editing-reliability-increment
  - project-configuration-increment
  - quality-gates
---
## Review instructions
Five representative product workflows, approved as the owner review on 2026-11-25. The developer owns the full functional regression scope. The former 25-case definition is preserved at [the exact prior revision](https://github.com/aschenrot/prism/blob/8cb4e530912b6d05fa4519b4d87b8602b500fe65/.prism/records/m1-milestone-acceptance.md) and in the linked M1 functional verification record. These five new P-series cases do not reuse the old IDs or inherit any outcomes. Earlier changes-requested review remains historical and read-only. Only an explicit owner decision accepts M1; a green CI run does not.

## Setup
Use the exact verified clean main revision. Stop the old dev server; if the worktree is clean, pull fast-forward-only, install with npm ci and run npm run dev. Open Prism Development > Overview > Awaiting acceptance > this milestone acceptance record. Start a new review. Keep Prism Development records read-only; for the brief editing workflow use a clearly disposable record in an existing non-production project. Do not create schemas, inject failures, modify Git files, rerun automated checks, or perform backup/restore or registry changes for the owner review. A pre-existing configured example/scratch project is sufficient. Where sample records or fields do not exist, inspect the verified fixture screenshots and evidence instead of creating elaborate data; note any evidence-only observation. If neither normal usage nor the linked evidence is sufficient to evaluate a workflow, mark it Blocked and explain. Do not mark a workflow Passed solely because CI is green.

Assess whether the product is coherent, understandable and useful, not every implementation detail. Record actual observations, and mark Failed or Blocked with notes if any material problem prevents the workflow. You may complete the cases in any order. The technical evidence and boundaries are recorded in M1 functional verification and the PR's exact-revision verification record. Finalize the new review with an explicit decision; export results or copy the review summary. No automatic status or release change.

## P. Product acceptance
- [ ] P01 — **Navigate and read work** — In Prism Development, open Work, search for an existing task, open its record page and briefly expand Relationships and Implementation evidence. Return using Back, then switch between Requirements and Overview. Expected: one correctly scoped toolbar on record lists, familiar search placement and retained return context, collapsed secondary sections on entry, predictable navigation, readable hierarchy and usable controls. Evaluate whether the experience feels coherent; exact control counts, history, sorting, focus and layout regression are developer-owned.
- [ ] P02 — **Capture, edit and recover an idea** — In a non-production project, capture a clearly disposable note or task in Inbox. Open it, make a small unsaved edit, choose Keep draft & close, Resume draft, save the edit and finish triage. Expected: understandable transition from captured idea to saved work, clear distinction between local draft and canonical save, no surprising navigation or data loss, discoverable recovery. Technical recovery, undo/redo, autosave, trash, duplication, conflicts and unfinished definitions are verified separately; no fault injection required.
- [ ] P03 — **Find and organize connected knowledge** — In Prism Development, open an existing Requirement and follow a linked Task or Objective; use Requirements Traceability and Data library Search to locate related work. Briefly inspect Schemas, Templates and configurable table Columns, using fixture screenshots for populated configurations if the selected project has none. Expected: one source of truth, understandable connections and search provenance, configurable structure that makes sense, clear distinction between authored data and derived views. No schema or template authoring required for this judgment.
- [ ] P04 — **Plan and understand progress** — In Work, switch between Table, Board and Plan; inspect an existing task or use the verified fixture screenshots for a populated plan. Inspect Timeline, using the verified dated fixture if the project lacks date fields, then return to Roadmap or Overview. Expected: the same work and authored status are recognizable across views, dependencies and dates are understandable, empty/unconfigured states are honest, and the views help plan work without inventing completion or schedules. No manual drag, cycle construction or saved-view configuration required.
- [ ] P05 — **Trust project boundaries and delivery evidence** — Open Quality in Prism Development and intentionally request the public GitHub runs; open one known increment with a linked PR and inspect its evidence. Switch to another configured project and return. Review the developer evidence for backup, restore and local registration rather than running CLI commands yourself. Expected: clear separation of project data, authored status, remote evidence and human approval; recognizable project identity and understandable recovery boundaries. A live request blocked by network/rate limit is an observation, not a functional pass; record whether it prevents your product judgment.

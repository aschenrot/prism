---
id: m1-milestone-acceptance
type: Test
title: Milestone acceptance — configurable knowledge and management
status: In progress
priority: High
accent: teal
tags: [acceptance, quality, milestone]
relationships:
  - knowledge-engine
  - hosted-delivery-increment
  - hosted-workflow-metadata
  - hosted-pr-association
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
  - quality-gates
---
## Review instructions
Owner-approved consolidated M1 product review. Do not execute as final until the complete milestone scope is delivered and verified on the exact candidate. Review definition evolves as increments add concrete capabilities; do not mark cases passed before observations. Existing accepted historical reviews remain historical. Automated CI evidence and human product acceptance are distinct. Use disposable isolated projects/records, never destructive operations on live project data. Record environment, exact revision, observations and explicit final decision. Escalate consequential issues before the final review if necessary.

## H. Hosted delivery evidence
- [ ] H01 — **Read hosted workflow metadata** — Open Quality for the configured Prism repository, request GitHub runs, follow one run and associated PR link, and inspect the reported head and observation time. Expected: intentional lookup, clear source and provider state, useful links, no implication that a PR head proves its checkout or that CI proves manual acceptance.
- [ ] H02 — **Keep remote evidence separate** — Switch to a repository project without GitHub configuration, return to Prism, and inspect local evidence alongside hosted results. Expected: no accidental lookup or project leakage, clear unavailable state, independent local evidence and authored planning status, no automatic completion.

- [ ] H03 — **Inspect scoped pull requests and jobs** — Open an increment with an authored repository-qualified PR reference, request PR metadata and associated runs, load one selected run's job details, and compare reported head and attempt. Expected: only explicit associations, independently observed status, clear partial/unavailable states, no suggestion that provider-reported head is the actual checkout or that a green job establishes record acceptance.

## R. Record management and reliability
- [ ] R01 — **Navigate and sort consistently** — Open record menus from Table, Board and record pages; navigate between collection and record, scroll and use keyboard controls. Sort the table in both directions. Expected: usable focus and pointer targets, menu remains anchored while visible, stable column geometry, predictable dismissal and preserved context.
- [ ] R02 — **Protect authored changes** — Edit disposable records, exercise recovery, conflict review, cancel, duplicate and reversible trash. Expected: no silent overwrite or loss; independent copies and preserved links; clear save/recovery state.

## K. Knowledge and project management
- [ ] K01 — **Edit a linked requirement once** — In a disposable project, connect an objective, requirement and task and edit the requirement through the supported editor. Expected: one canonical record updates the relevant views; existing records remain valid or migrate explicitly.
- [ ] K02 — **Find and manage work** — Review the final M1 schema, search, template, inbox and management-view capabilities using the delivered product workflows. Expected: cohesive workflows with clear scope, accessible interaction and no duplicate source of truth. Refine concrete cases as the corresponding increments are implemented.

- [ ] K03 — **Edit configured properties safely** — In a disposable project with a version-1 schema, edit text, number, date, enum, boolean and record-reference properties. Keep a draft, reopen, and save after reviewing an externally changed schema. Expected: recoverable values, clear validation, stable property identity, stale-schema rejection, no data loss or leakage to another project.

- [ ] K04 — **Manage schema definitions without rewriting values** — In a disposable project open Schemas, create a numeric or choice property, save a record value, rename and retire the definition, then reactivate it. Expected: stable identity, clear usage and impact, retained value, protected stale writes and no implicit type conversion or removal.

- [ ] K05 — **Create and use custom entity identities** — Define a custom Task-role entity in Schemas, add an entity-scoped property, assign it to a disposable Task and save its value. Filter Work by that identity, rename/retire the type, and reopen the existing record. Expected: stable custom identity, preserved built-in behavior, correct scoped properties and filters, no new retired assignment or implicit data conversion.

- [ ] K06 — **Configure a reusable table** — Add a typed property column to Work, hide and reorder built-in columns, save the view, reopen and navigate back. Rename or retire the property. Expected: same order, preserved data, clear retired/unavailable labels, stable widths, and accessible controls; no automatic rewrite of saved definitions.

- [ ] K07 — **Find authored knowledge across a project** — Search saved records by text and configured properties, follow a matching record and navigate back. Search repository documentation/source content and preview a file. Switch projects. Expected: relevant results with provenance, clear incomplete/unavailable states, preserved return query, no cross-project results, no indexing of unsaved or trashed data.

- [ ] K08 — **Create from a project template** — Define a template with initial content and a typed default, create a record in the matching collection, then edit or retire the template. Expected: independent new Concept record, current schema validation, stable template identity, no copied acceptance or delivery evidence, unchanged previously created records.

- [ ] K09 — **Capture and triage knowledge** — Capture a title and notes, open the saved record, edit it if needed and finish triage. Expected: one independent canonical record, protected unsaved input, unchanged identity and content during triage, no cross-project leakage.

- [ ] K10 — **Move board records safely** — Move a disposable task between status columns using a drag handle and the keyboard-operable Move to control. Attempt movement with a retained draft or externally changed revision. Expected: confirmed status, stable identity, no silent overwrite, clear blocking feedback, predictable focus and retained filters.

- [ ] K11 — **Inspect dependencies without changing work** — Create explicit depends-on and blocks relationships, including a duplicate assertion, unresolved target and cycle. Open Plan in Work, filter and follow a prerequisite outside the collection. Expected: consistent direction, no duplicate edge, clear missing/cyclic state and unchanged authored status, with return context.

- [ ] K12 — **Review authored timeline dates** — Define two date fields, author a valid range and an undated task, select the field mapping in Timeline and save/reopen the view. Retire one mapped field. Expected: accurate calendar range, explicit unplotted records, stable mapping and preserved values, no inferred schedule or automatic status changes.

- [ ] K13 — **Undo and redo draft changes** — Edit multiple fields, undo and redo with buttons and keyboard, branch from an undone draft, then keep/reopen and save. Expected: current draft recovery, correct history boundaries, no canonical write before Save, no restoration of obsolete revisions.

- [ ] K14 — **Use opt-in autosave safely** — Enable autosave on a disposable record, type valid and invalid values, simulate an external change during a pending save, then resume the retained draft. Expected: valid acknowledged saves only, no invalid or conflicting overwrite, no automatic retry or auto-enable on reopen, clear pause state.

- [ ] K15 — **Back up and restore disposable project data** — Stop editors, create and verify a backup, restore into a new directory, register/open the restored copy and compare records, schema, templates and trash. Expected: exact data, no overwrite or registry leakage, integrity failures visible, incomplete restores cannot open.

- [ ] K16 — **Register and reopen an independent project** — Stop Prism, register an existing disposable folder using the local command, restart and select it, save a record, change its title/profile settings, restart and switch between projects. Expected: stable identity, isolated data, no machine paths in browser metadata, no overwritten portable registry, explicit overrides still work.

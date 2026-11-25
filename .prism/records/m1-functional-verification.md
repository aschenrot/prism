---
id: m1-functional-verification
type: Document
title: M1 functional verification and five-workflow review coverage
status: In progress
priority: High
accent: teal
tags: [quality, regression, milestone]
relationships:
  - knowledge-engine
  - m1-review-readiness
  - m1-milestone-acceptance
  - editor-regression-spec
  - m1-acceptance-navigation-correction
  - ci-verification
---
## Purpose
The owner approved reducing M1's product acceptance from 25 detailed cases to five representative workflows on 2026-11-25. This record is a developer-owned verification specification, not a second owner acceptance checklist. Original detailed definition at [8cb4e53](https://github.com/aschenrot/prism/blob/8cb4e530912b6d05fa4519b4d87b8602b500fe65/.prism/records/m1-milestone-acceptance.md); its 25 exact case texts are preserved below. Local execution snapshots and the prior changes-requested result remain unchanged. New P-series IDs identify new product observations, not transferred outcomes.

## Coverage and residual judgment
| Original cases | New owner workflow | Developer evidence |
| --- | --- | --- |
| R01, K02 | P01 | routes, navigation, views; browser sorting, menus, history, all product and game-profile destinations, secondary disclosures, narrower window, isolated screenshots |
| R02, K09, K13, K14, K18, K19 | P02 | editor, draftHistory, autosave, draftInventory, definitionRecovery, inbox, trash, record-management; browser recovery/conflict/triage/history/autosave/definition cases |
| K01, K03, K04, K05, K06, K07, K08, K17 | P03 | custom-properties, tableColumns, search, templates, traceability, relationships; browser typed-property, entity, columns, search, template, traceability and one-canonical-edit integration cases |
| K10, K11, K12 | P04 | dependencyPlan, timeline, views and browser board/plan/timeline cases, screenshots with authored dates |
| H01, H02, H03, H04, K15, K16 | P05 | hosted-verification, pullReferenceEditing, projectBackup, localRegistry, registry, projects, actual CLI round trip, browser scoped PR and opt-in provider fixtures |

Each row maps to implemented technical checks, not a claim of exhaustive assertion-by-assertion equivalence or human observation. The previous 25 cases include subjective judgment that is represented by the new workflows; no unexecuted check is marked Passed. Existing legacy editor-regression-spec coverage gaps remain documented. The full locked Chromium suite and unit/integration tests run on Ubuntu/Windows Node 22/26; passing screenshots support visual assessment at tested viewports, not comprehensive accessibility, screen-reader or mobile support. GitHub provider behavior is exercised with controlled responses; actual provider shapes and exact GitHub CI evidence are inspected separately. The original owner H01–H04 observations apply only to the old revision. Live application lookup in the current owner environment remains an optional observed product interaction and may be blocked by provider/network conditions. Backup/registration is verified with disposable fixtures and actual local CLI invocations, not real user data. CLI output and storage integrity do not prove universal recoverability.

## Baseline evidence
PR #37 integrated at 8cb4e530912b6d05fa4519b4d87b8602b500fe65. [Verify 45581861697](https://github.com/aschenrot/prism/actions/runs/45581861697) passed 100 unit/integration tests and 39 browser cases per configuration, zero failures/skips/flakes and both audits zero reported vulnerabilities. Clean eligible browser evidence at exact main. Corrected navigation and disclosures visually inspected in [PR #37](https://github.com/aschenrot/prism/pull/37). A full fresh matrix is required for the consolidated-review candidate; do not treat prior green results as evidence for a new revision.

## Archived 25-case functional scope
These are the original texts from the prior review definition, retained verbatim for traceability. Historical owner wording and checkboxes are not current tasks or recorded outcomes.

- [ ] H01 — **Read hosted workflow metadata** — Open Quality for the configured Prism repository, request GitHub runs, follow one run and associated PR link, and inspect the reported head and observation time. Expected: intentional lookup, clear source and provider state, useful links, no implication that a PR head proves its checkout or that CI proves manual acceptance.

- [ ] H02 — **Keep remote evidence separate** — Switch to a repository project without GitHub configuration, return to Prism, and inspect local evidence alongside hosted results. Expected: no accidental lookup or project leakage, clear unavailable state, independent local evidence and authored planning status, no automatic completion.

- [ ] H03 — **Inspect scoped pull requests and jobs** — Open an increment with an authored repository-qualified PR reference, request PR metadata and associated runs, load one selected run's job details, and compare reported head and attempt. Expected: only explicit associations, independently observed status, clear partial/unavailable states, no suggestion that provider-reported head is the actual checkout or that a green job establishes record acceptance.

- [ ] H04 — **Author pull request references explicitly** — Open a disposable repository Increment, add an explicit repository-qualified PR reference, save, and inspect its authored association. Inspect whether the form makes the association explicit and distinguishes saved references from provider results. Expected: understandable authoring and independent evidence; no automatic acceptance. Stale form and no-remote-on-save regressions are developer-verified.

- [ ] R01 — **Open work, switch pages and return** — In Work, choose Table. Enter a disposable task title in the left-aligned Search records field, and click that task to open its individual page. Expand Relationships and Implementation evidence, then collapse them. Use the Back button beside the breadcrumb; verify the earlier task search is restored. Switch to Requirements, Overview, then Work using the left sidebar. Try normal navigation and the task menu in Table or Board. Expected: one current category toolbar and search field, no stale controls, prior search restored on Back, secondary sections collapsed on entry, clear hierarchy and predictable navigation. The developer checks exact control counts, keyboard activation, sorting, menu placement and layout regressions in CI.

- [ ] R02 — **Protect authored changes** — Edit a disposable record, keep an unfinished draft, reopen it, and use normal Save or Cancel. Inspect the record actions, including duplicate and reversible trash. Expected: understandable distinction between saved record, draft, copy and trash; clear recovery feedback. The developer exercises conflicts, competing tabs, missing files and preservation of links.

- [ ] K01 — **Edit a linked requirement once** — In a disposable project, connect an objective, requirement and task and edit the requirement through the supported editor. Expected: one canonical record updates the relevant views; existing records remain valid or migrate explicitly.

- [ ] K02 — **Find and manage work** — Review the final M1 schema, search, template, inbox and management-view capabilities using the delivered product workflows. Expected: cohesive workflows with clear scope, accessible interaction and no duplicate source of truth. Use K03–K19 for the specific workflows; evaluate consistency of interaction and terminology across them, visible keyboard focus, navigation, readable layouts at ordinary window sizes and reduced-motion behavior.

- [ ] K03 — **Edit configured properties safely** — In a disposable project with a version-1 schema, edit text, number, date, enum, boolean and record-reference properties. Keep a draft, reopen and save through the normal editor. Expected: understandable property controls, validation and retained values. Stale-schema and isolation checks belong to the developer.

- [ ] K04 — **Manage schema definitions without rewriting values** — In a disposable project open Schemas, create a numeric or choice property, save a record value, rename and retire the definition, then reactivate it. Expected: stable identity, clear usage and impact, retained value, protected stale writes and no implicit type conversion or removal.

- [ ] K05 — **Create and use custom entity identities** — Define a custom Task-role entity in Schemas, add an entity-scoped property, assign it to a disposable Task and save its value. Filter Work by that identity, rename/retire the type, and reopen the existing record. Expected: stable custom identity, preserved built-in behavior, correct scoped properties and filters, no new retired assignment or implicit data conversion.

- [ ] K06 — **Configure a reusable table** — Add a typed property column to Work, hide and reorder built-in columns, save the view, reopen and navigate back. Rename or retire the property. Expected: same order, preserved data, clear retired/unavailable labels, stable widths, and accessible controls; no automatic rewrite of saved definitions.

- [ ] K07 — **Find authored knowledge across a project** — Search saved records by text and configured properties, follow a matching record and navigate back. Search repository documentation/source content and preview a file. Switch projects. Expected: relevant results with provenance, clear incomplete/unavailable states, preserved return query, no cross-project results, no indexing of unsaved or trashed data.

- [ ] K08 — **Create from a project template** — Define a template with initial content and a typed default, create a record in the matching collection, then edit or retire the template. Expected: independent new Concept record, current schema validation, stable template identity, no copied acceptance or delivery evidence, unchanged previously created records.

- [ ] K09 — **Capture and triage knowledge** — Capture a title and notes, open the saved record, edit it if needed, finish triage, then add it back using the record menu. Expected: understandable, reversible inbox membership and one canonical record. Recovery protection and project isolation are developer-verified.

- [ ] K10 — **Move board records safely** — Move a disposable task between status columns using a drag handle and the keyboard-operable Move to control. Expected: predictable movement, confirmed status and retained filters. Recovery, stale revision and keyboard-focus regressions are developer-verified.

- [ ] K11 — **Inspect dependencies without changing work** — Create normal depends-on and blocks relationships. Open Plan in Work, filter and follow a prerequisite outside the current list. Expected: understandable direction, useful planning context and unchanged authored status. Duplicate, missing and cyclic edges are exercised by the developer.

- [ ] K12 — **Review authored timeline dates** — Define two date fields, author a valid range and an undated task, select the field mapping in Timeline and save/reopen the view. Retire one mapped field. Expected: accurate calendar range, explicit unplotted records, stable mapping and preserved values, no inferred schedule or automatic status changes.

- [ ] K13 — **Undo and redo draft changes** — Edit multiple fields, undo and redo with buttons and keyboard, branch from an undone draft, then keep/reopen and save. Expected: current draft recovery, correct history boundaries, no canonical write before Save, no restoration of obsolete revisions.

- [ ] K14 — **Use opt-in autosave safely** — Enable autosave on a disposable record, make a valid change and observe confirmation. Reopen the editor and inspect the opt-in state. Expected: clear control of when data saves, understandable feedback, no unexpected autosave activation. Invalid input, external conflicts and pause behavior are developer-verified.

- [ ] K15 — **Back up and restore disposable project data** — Review the supported backup and restore workflow in docs/backup.md and the exact-revision developer verification evidence. If you choose to exercise it, use a disposable project and a new restore directory with editors stopped. Expected: understandable recovery path, explicit scope and safety boundaries. Byte equality, corruption, incomplete restore and no-overwrite checks belong to the developer.

- [ ] K16 — **Register and reopen an independent project** — Review docs/project-registration.md and the project switcher; if exercising registration, use an independent disposable folder and follow the documented stop/restart workflow. Inspect project settings and switch between configured projects. Expected: understandable project identity, available profiles and independent workspaces. Registry preservation, overlapping stores and machine-path isolation are developer-verified.

- [ ] K17 — **Review requirements traceability and project status** — Link disposable task, test and document records to a requirement with explicit relationship kinds, leave another requirement unlinked and add a generic link. Open Traceability, inspect gaps and follow a linked record; compare Overview. Expected: explicit links only, visible gaps, accurate authored status, retained context and no inferred test results or completion.

- [ ] K18 — **Recover a draft after its record disappears** — Retain a disposable draft and open Recovery. Review its identity, export and resume/discard choices without moving the underlying file. Expected: understandable recovery inventory and clear consequences for each action. Missing canonical files, restored files and cross-project isolation are developer-verified.

- [ ] K19 — **Retain unfinished definition input** — Start a property, entity and template definition with incomplete values, keep and close each, reload and resume. Expected: the unsaved input remains separate from canonical definitions, current revision still gates saving, clear export/discard options and no cross-project recovery.

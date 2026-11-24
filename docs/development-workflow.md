# Develop Prism using Prism

## Workspace
Run npm run dev from the repository root, select Prism Development. The tracked .prism/projects.yaml registry opens the real repository alongside Emberfall and the starter workspace. A machine-local registry or explicit environment override takes precedence. To restore default discovery, clear PRISM_PROJECT and PRISM_PROJECTS and review any local registry; do not delete custom project data.

Prism's authored records and view definitions live in .prism/records and .prism/views. These are product data, intentionally tracked alongside code. Machine-specific registry paths and caches stay ignored. The example repositories remain separately scoped stores; the read-only Prism repository browser can inspect example source tracked in Prism but not their hidden .prism records.

## Authoritative sources
- Product intent, decisions, tasks, requirements, milestones: Prism records.
- Technical implementation: source files and Git history.
- Detailed architecture, workflow and dependency policy: docs/ and AGENTS.md, referenced by knowledge records.
- Actual build/test results: local verification report and command output (optional hosted CI evidence); summarize with revision and environment.
- Code review and release approval: GitHub PRs and explicit local check evidence, not duplicate task status.

## Working agreement
1. Read the current milestone, linked requirements, blockers and relevant source.
2. Define or update a task/feature record with clear acceptance criteria and link it to its milestone. Use Concept for planned, In progress for active or awaiting verification, Ready only when the stated acceptance criteria have evidence (a decision or document may be Ready when adopted).
3. Implement a small vertical slice. Inspect current file revisions before writing. Never overwrite unrelated user edits, including local planning records.
4. Run typecheck, tests, build and applicable browser checks. Attach revision-specific evidence to a Test record or existing task; distinguish user-reported and directly observed results.
5. Update status and links in the same reviewed change where practical. Do not claim tests or CI passed without evidence.
6. Commit only intended changes; leave personal configurations and local project data out. Review git status and diffs before pulling or pushing. Resolve conflicting Markdown changes deliberately.
7. Review the current milestone and blockers using the saved views. Let actual friction drive the next feature.

Generic legacy links remain directional references. Explicit typed edges state a relation; neither generic links nor a verifies edge establish that a test actually ran or passed. Saved views use the existing single type/status/priority/text filter; tag-like searches are plain text matching rather than exact tag predicates.

## Verification checklist for self-management
- Default launch lists Prism Development first, then Emberfall and Starter workspace.
- Open Product roadmap, Development backlog, Decision log and Engineering wiki.
- Open Requirements and follow a linked record/backlink.
- Repository shows server/index.ts, shared/records.ts and docs/development-workflow.md.
- Audit should show no findings on the original seeded records; user edits may produce intentional findings.
- Change a disposable record in one project and verify another project does not change.
- Confirm the roadmap links point to existing canonical records. Review git diff before committing.
- Do not test destructive operations against live project data; use disposable records or isolated fixtures.

## Current limitations
No custom schemas, custom relationship vocabularies, dependency-cycle analysis, date-based roadmaps, hosted CI ingestion, generated technical wiki, autosave or undo yet. Local Git and local verification report ingestion are implemented. Do not maintain parallel workarounds as another source of truth. Track the missing capability in Prism.

## Reconcile work with implementation
For substantial commits use a Git trailer, for example `Prism-Record: interaction-hit-areas`. Multiple trailers may refer to multiple tasks. This links explicit intent to a commit; do not derive completion from a commit message. In the same change, update the relevant task's implementation notes and acceptance state. Record actual checks and revision-specific evidence afterward. A narrow task can be accepted when its own criteria are met while a related integration requirement remains open. The completed lockfile configuration and separate local verification gate are an example.

Prism now reads local Git trailers and explicit reviewed implementationCommits hashes and exposes linked changes in Work, Overview and record details. Engineering / Changes exposes unmatched references and commits without explicit links. Only the latest 100 HEAD-reachable commits are loaded, and shallow history is marked. Optional hosted CI ingestion, workflow transition semantics and scoped milestone progress are still future work. See .prism/records/delivery-evidence.md.

## Local-first merge policy
Hosted Actions is optional and manual-only due to the owner's exhausted allowance. Stop dev, commit intended changes, check git status, run npm run verify. This reinstalls locked dependencies, runs typecheck/test/build and both audits, writes a bounded local report and exits nonzero for failed/skipped checks or dirty/changed revision. A dirty report is diagnostic. Network/install failure is not a passed check. Quality / Audit shows recorded results; compare the revision and recheck current tree cleanliness before review. Keep generated reports ignored, summarize actual outcomes and tested hash in PR review. Manual runtime, accessibility and acceptance checks remain necessary. Do not require hosted CI; verify other platforms locally when making platform-specific release claims.

After the owner accepts the foundation, use main as integration branch and short-lived feat/, fix/, refactor/, docs/, chore/ branches with focused PRs. Preserve hashes using regular merge commits; The owner enabled regular merge commits and PR #1 was merged at 156700abada6ec691e5fb0e7e4225cc2fffe9af0. Do not rewrite already attributed history. No duplicate GitHub issues for Prism tasks; optional issues are external feedback intake. See development-workflow-decision.

## Acceptance queue
Each substantial implementation PR has a linked Test record with a stable case ID per check, reproducible setup, actions and expected results; include the exact tested revision, environment, failed/blocked observations and explicit owner decision. Find open reviews under Saved views / 10 · Acceptance queue or Quality / Wiki. The current editor acceptance test is editor-acceptance. The implementation task remains In progress until actual acceptance. Do not copy a checklist into multiple canonical records; PR descriptions link the Test record. Wiki checkboxes are read-only; edit the Markdown in Notes to record outcomes. Run the local clean-revision gate before editing tracked acceptance records; review acceptance-only diffs separately and do not stage test scratch data. Native checklist and per-run evidence UI remain planned.

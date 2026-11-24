# Develop Prism using Prism

## Workspace
Run npm run dev from the repository root, select Prism Development. The tracked .prism/projects.yaml registry opens the real repository alongside Emberfall and the starter workspace. A machine-local registry or explicit environment override takes precedence. To restore default discovery, clear PRISM_PROJECT and PRISM_PROJECTS and review any local registry; do not delete custom project data.

Prism's authored records and view definitions live in .prism/records and .prism/views. These are product data, intentionally tracked alongside code. Machine-specific registry paths and caches stay ignored. The example repositories remain separately scoped stores; the read-only Prism repository browser can inspect example source tracked in Prism but not their hidden .prism records.

## Authoritative sources
- Product intent, decisions, tasks, requirements, milestones: Prism records.
- Technical implementation: source files and Git history.
- Detailed architecture, workflow and dependency policy: docs/ and AGENTS.md, referenced by knowledge records.
- Actual build/test results: command output or CI run; summarize with revision and environment.
- Code review and release approval: GitHub PRs and checks, not duplicate task status.

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
No custom schemas, custom relationship vocabularies, dependency-cycle analysis, date-based roadmaps, automated Git/CI ingestion, generated technical wiki, autosave or undo yet. Do not maintain parallel workarounds as another source of truth. Track the missing capability in Prism.

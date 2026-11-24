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
Each substantial implementation PR has a linked Test record with a stable case ID per check, reproducible setup, actions and expected results; include the exact tested revision, environment, failed/blocked observations and explicit owner decision. Find open reviews under Saved views / 10 · Acceptance queue or Quality / Wiki. The current editor acceptance test is editor-acceptance. The implementation task remains In progress until actual acceptance. Do not copy a checklist into multiple canonical records; PR descriptions link the Test record. Native acceptance-tagged Test records support local execution; generic Wiki checkboxes remain read-only. Run the clean-revision gate before manual review; review any definition/status changes separately and do not stage scratch data or local execution files.

Record-centric acceptance: Overview / Awaiting acceptance opens pending acceptance Test records directly. Open a task to read it in the main workspace and follow its Linked tests. Edit test definition explicitly opens the recoverable editor; native case results use a separate local execution. Use browser/app Back to restore the earlier visit; breadcrumbs navigate the category hierarchy. PR #9 includes the navigation follow-up because manual editor review depends on it. Check editor-acceptance and the technical editor-regression-spec before approval.

## Run acceptance in Prism
Open Overview / Awaiting acceptance or a task's Start/Resume acceptance link. Run npm run verify on the clean proposed revision first. Enter reviewer and environment and start the native run; record each actual result, add observations for failures/blocks, and save before switching cases. Resume or inspect prior runs using the run picker. All required cases must pass and the reviewer must explicitly record a decision; failed/blocked reviews may be finalized as changes requested. Export the JSON evidence and attach or summarize the exact revision and outcomes in the PR. Local run files are ignored by Git; do not assume they are synchronized or backed up. Do not edit canonical Test definitions just to record results. The accepted test definition and workflow status change only in a reviewed record update. Native runs do not replace clean automated verification or explicit merge approval.

## Local browser regression
Stop the development server first. Playwright Test 1.65.1 is pinned in the committed manifest and lockfile. On a new machine install locked dependencies with `npm ci` and Chromium with `npx playwright install chromium`. No routine dependency update is necessary. On a clean branch run `npm run verify` then `npm run test:browser`. The browser runner refuses an unlocked dependency and an existing server on port 4174, builds production assets, creates isolated disposable data, runs seven scenarios, writes `.prism/cache/browser/latest.json` and a per-run report directory with failure traces/screenshots. No hosted CI required. A passing six-step npm report is not a passing browser report. If the browser suite fails, inspect the report and fix the cause; do not mark checks passed or merge on diagnostic evidence. Retain any technical coverage gaps in editor-regression-spec. The owner UX review contains five focused cases; Save & next persists before advancing. Use Copy review summary to paste the saved evidence into PR #9 or chat. Attach browser/latest.json and npm verification/latest.json (or their actual console output) separately. No automatic publishing or status transition.

The first browser run passed all seven scenarios on Windows but was diagnostic because the worktree was dirty. Inspect `git status --short` before pulling or running verification; preserve owner data and do not stage unrelated scratch records or remove files automatically. See browser-verification for exact observed evidence.

PR #9 was accepted at exact tested head 0c4d03a and merged with regular merge a06c1cf; identical tree. The next focused branch is feat/collection-interaction. Browser suite now requires at least ten scenarios; actual verification of the increment remains pending. Owner review is collection-acceptance (three usability cases). Use disposable records for create, edit and trash tests. Trash is canonical data and may appear in Git status; never stage unrelated owner changes or scratch data. No dependency installation beyond the existing locked browser setup is needed.

Accepted PR #10: owner confirmed both automated gates and the UX passed after final polish head 79c95b609992d98be902f56f5d49d8092d7cce6e, explicitly approved regular merge and continued development on 2026-11-24. Final detailed report counts were not supplied. Merge a9d5ca8759ec13ff1fc37179a88368047d4eb126 preserves the identical accepted file tree. This is owner-reported historical acceptance, not evidence for subsequent changes.
Next branch feat/record-actions; thirteen browser scenarios minimum, two focused manual UX cases in record-actions-acceptance. Run clean npm and browser gates before owner acceptance. Browser menus depend on modern native popover support; test keyboard, viewport clipping and focus in the installed Chromium. No new dependencies.

## Coherent delivery increments
Owner confirmed the npm and browser gates passed at intermediate PR #11 head 3775a7ae79a111f0ec6be30e9abb44e90eff557e (reported in development chat, no detailed new report counts supplied). This is historical evidence for the menu/relationship slice only. The expanded PR requires fresh exact-revision verification and one combined UX acceptance. No merge approval has been given for PR #11.
Use one Increment record for a coherent capability, attach tasks and the acceptance Test through Contains links, and connect the milestone with Contains. Use focused commits with stable Prism-Record trailers on one PR. Avoid a separate owner review cycle for each small interaction patch. The real record-management-increment maps PR #11 and the included tasks. Current scope now includes property editing, duplication/copy, bounded bulk editing and native delivery scope. Sixteen browser scenarios minimum; run npm run verify and npm run test:browser once on the proposed clean revision, then five focused owner UX cases. Quality and increment detail read browser verification directly. A PR does not define the planning hierarchy; non-software projects may also use increments. No automatic merge or automatic Ready status from linked changes.

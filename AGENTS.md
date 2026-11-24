# Prism engineering rules

- Keep Markdown/YAML records canonical; never duplicate record content in a view or cache.
- Use stable record identifiers. Paths and view-specific presentation are not record identity.
- All writes pass through validation and revision checks. Do not silently overwrite external edits.
- Preserve unknown metadata when evolving schemas; implement versioned migrations explicitly.
- Keep frontend state, server query results and durable project data separate.
- Favor accessible native controls, keyboard navigation, predictable focus and reduced motion.
- Build polished vertical slices. Do not introduce duplicate libraries or speculative abstractions.
- Use fictional demo content only. Never commit credentials or private game assets.
- Run typecheck, tests and production build before claiming a change is verified.
- Review dependency licenses before introducing dependencies. Do not assume commercial extensions are free.
- Keep application changes separate from user project data and never automatically push user data.

## Dependency policy
- Before adding or updating dependencies, query the official registry's latest stable dist-tag, release notes, security advisories, Node engine and peer requirements. Never assume a previously known version is current.
- Prefer the latest compatible stable release; no beta, RC, nightly or floating latest in committed manifests. Document any exception, especially for major upgrades and platform-specific packages. Keep React/React DOM, Vite/plugin and related type packages compatible.
- Separate security fixes from unrelated major upgrades where possible. Review migrations, license, native/install scripts and transitive dependencies. Never use forced audit fixes or broad script approval as a substitute for review.
- Use a checked-in package-lock.json and npm ci once the lockfile is generated in a registry-enabled environment. Do not fabricate a lockfile. Run npm outdated and npm audit after resolution; treat high/critical findings as release blockers unless an explicit documented exception exists.
- Run local npm run verify and runtime smoke tests before merging; obtain platform-specific local evidence before claiming Windows/Linux and supported Node compatibility. Hosted CI is optional. Do not claim a version combination is verified until checks actually pass.
- Keep dependency install-script approvals narrowly scoped to reviewed versions; review new scripts after every upgrade.

## Dogfooding
- Prism Development is the primary product and project workspace. Read .prism/records and .prism/views before choosing work. Keep planning status in records; docs/roadmap.md is an index only.
- Link each substantial change to a feature/task and milestone, write acceptance criteria and record revision-specific verification evidence. Use the workflow in docs/development-workflow.md.
- Treat the owner's edited records as real data. Inspect existing files before updating; do not reseed or overwrite the workspace. Never write automated tests against live workspace counts.
- Emberfall and Starter workspace remain reference projects; automated tests use controlled fixtures and temporary directories. Do not commit personal paths, credentials, private game assets or unrelated local project edits.

## Change-to-work traceability
- Include one or more commit-message trailers `Prism-Record: <stable-record-id>` for substantial changes to Prism. Use existing task IDs or create the task in the same commit. This is explicit attribution, not a completion signal.
- Update implementation notes and acceptance status in the same change. Do not leave a completed narrow task open solely because a separate integration gate remains; move that gate to its actual owning record with explicit links.
- Record test/CI outcome, revision and environment separately from authored task status. A commit alone never establishes acceptance. Never fabricate a self-referential commit SHA inside the same commit; use commit trailers, then record observed revisions in follow-up evidence.
- Interactive surfaces should have coherent hit areas, keyboard activation, hover/focus/selection and visible blocked-state reasons. Check actual pointer targets, not just the visual design.

## Integration policy
- Hosted GitHub Actions is optional and manual-only; local automated verification and human acceptance are the merge gate. Use npm run verify on a clean committed revision; do not claim a dirty or historical report as current evidence. Keep local reports under ignored .prism/cache, and record reviewed outcomes in PRs.
- After foundation PR #1 is locally verified and accepted, use short-lived topic branches from main, focused PRs and regular history-preserving merge commits. Do not squash or rebase already attributed commits. Never merge without explicit owner approval. Prism owns the internal backlog; GitHub Issues are optional intake, not duplicate tasks.

## Interaction consistency
- Repeated controls retain a canonical relative order. Default selection and contextual availability must not reorder them. Resolve destination, mode and filters together; never render an unrelated intermediate view intentionally.
- Keep personal presentation preferences separate from canonical project data and saved views. Validate persisted values against current available modes, provide safe fallback when storage is unavailable, and never rewrite shared definitions implicitly.

## Editing reliability
- Treat an unsaved draft as separate from canonical data. Retain its original revision and editable baseline. Validate at commit, not by trimming away intermediate input on every keystroke. Never replace an external revision without explicit review and a fresh expected-revision check.
- Recovery is best effort, not a backup. Report storage failure and competing recovery changes; do not silently discard or overwrite recoverable work. Explicit discard, recovery and export must remain distinguishable from canonical save.

## Acceptance handoff
- Each substantial implementation PR must have a linked, actionable Test record with stable case IDs, setup, action, expected result, exact tested revision/environment and explicit acceptance decision. Leave new checks unchecked until observed. Keep the test discoverable through the Acceptance queue and link from the implementation task; do not duplicate the checklist in chat or PR text as the authoritative copy.
- Reconcile accepted narrow tasks promptly without claiming broad feature or release acceptance. Separate historical evidence from current next actions. Verification runs use clean revisions; acceptance record edits are reviewed separately and must not include scratch project data.

## Workspace navigation
- Opening a record is a reading/navigation action, never implicitly entering edit mode. Use stable project/record identities in addresses; real links support browser semantics. Keep sidebar and breadcrumb navigation available in the main workspace, and preserve history context separately from canonical data.
- Breadcrumbs express hierarchy; Back/Forward express visit order. Guard dirty and pending edits across all navigation paths, including browser traversal. Never infer acceptance from a record link or completed-looking UI.

## Acceptance execution and motion
- For substantial PR reviews author acceptance-tagged Test records with grouped stable case IDs, bold short titles, actions and explicit Expected: outcomes using the supported Markdown convention. Keep definitions separate from local execution files. Do not derive passed results from old checkmarks. Capture actual tested revision, reviewer/environment, case outcomes and explicit decision. Treat historical/finalized runs as read-only; never auto-merge or complete tasks.
- Motion communicates navigation, not data changes. Keep the shell stable, use short enter-only transitions, reverse direction on Back and honor reduced motion. Do not delay correct state or animate polling/filter updates. Protect unsaved observations across navigation and do not represent unsaved text as persisted evidence.

## Reduce review burden
- Developer-owned technical regressions belong in automated tests and a linked regression specification; keep owner acceptance focused on usability, visual quality and judgment. Never replace an unexecuted or uncovered check with a fabricated pass. Browser runs use isolated fixture registries and must refuse an existing live workspace. Require exact locked browser tooling and revision-specific execution evidence before claiming browser verification.
- Cancel editing restores the recovery state at session entry, distinct from retaining or discarding the entire draft. Guard feedback uses non-blocking notifications; never hide failed saves or override conflicting recovery data. Copy/share only saved review evidence with an explicit owner action.

## Collection operations
- Place search and contextual creation in shared collection controls, not global navigation. Sort direction is explicit and persisted, with backward-compatible legacy defaults; stable tie-breaks. Reader focus must respect filters. Use the same revision-checked editor for direct edit actions and guard asynchronous navigation against stale entry identity.
- Removal is reversible trash, never permanent deletion. Preserve original bytes, IDs, inbound relationships and evidence. Warn about affected links, reject unresolved local drafts, validate expected revisions and never overwrite a destination on restore. Use only disposable isolated records for destructive regression tests.

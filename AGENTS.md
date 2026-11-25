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
- Verify the exact proposed revision with locked dependencies, typecheck, tests, production build, audits and applicable browser regression. For approved M1 increments, a reviewed full hosted matrix is sufficient automated evidence; local checks remain available for diagnosis. Do not claim a platform/version until its checks pass.
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
- Owner approved delegated development and integration through M1 on 2026-11-24. Review the full hosted Verify matrix (Ubuntu/Windows, Node 22/26), exact checked-out revision and proposed tree, scope, security, regressions and mergeability before each integration. A green run alone does not authorize an out-of-scope change. Require current checks and reverify if base/head changes; keep local reports ignored. GitHub required-check enforcement must be configured and verified by the owner; until then inspect all jobs explicitly. Do not bypass branch rules.
- Use focused PRs and regular history-preserving merge commits. Do not squash/rebase already attributed commits or bypass protection. The owner's standing approval is limited to verified M1 increments; no separate per-PR owner confirmation is needed within that scope. Escalate fundamental architecture/product changes, destructive or breaking migrations, security/licensing concerns, scope deviations and permission blockers. Keep human acceptance pending until consolidated M1 review; no automatic Ready status from CI. Outside M1, obtain explicit owner approval. Prism owns the backlog; GitHub Issues are optional intake.

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
- For substantial PR reviews author acceptance-tagged Test records with grouped stable case IDs, bold short titles, actions and explicit Expected: outcomes using the supported Markdown convention. Keep definitions separate from local execution files. Do not derive passed results from old checkmarks. Capture actual tested revision, reviewer/environment, case outcomes and explicit decision. Treat historical/finalized runs as read-only. Delegated technical integration is distinct from automated merge, task completion and human acceptance.
- Motion communicates navigation, not data changes. Keep the shell stable, use short enter-only transitions, reverse direction on Back and honor reduced motion. Do not delay correct state or animate polling/filter updates. Protect unsaved observations across navigation and do not represent unsaved text as persisted evidence.

## Reduce review burden
- Developer-owned technical regressions belong in automated tests and a linked regression specification; keep owner acceptance focused on usability, visual quality and judgment. Never replace an unexecuted or uncovered check with a fabricated pass. Browser runs use isolated fixture registries and must refuse an existing live workspace. Require exact locked browser tooling and revision-specific execution evidence before claiming browser verification.
- Cancel editing restores the recovery state at session entry, distinct from retaining or discarding the entire draft. Guard feedback uses non-blocking notifications; never hide failed saves or override conflicting recovery data. Copy/share only saved review evidence with an explicit owner action.

## Collection operations
- Place search and contextual creation in shared collection controls, not global navigation. Maintain one live toolbar in a stable host slot; new destinations must not retain stale controls or filters. Scope transient expansion to the current history entry; verify exact toolbar counts during category, record and project transitions. Sort direction is explicit and persisted, with backward-compatible legacy defaults; stable tie-breaks. Reader focus must respect filters. Use the same revision-checked editor for direct edit actions and guard asynchronous navigation against stale entry identity.
- Removal is reversible trash, never permanent deletion. Preserve original bytes, IDs, inbound relationships and evidence. Warn about affected links, reject unresolved local drafts, validate expected revisions and never overwrite a destination on restore. Use only disposable isolated records for destructive regression tests.

## Public preview and licensing
- Prism's own source uses AGPL-3.0-only. Keep the license verbatim and preserve third-party terms and notices. Never commit private project data or secret values. Review public visibility against complete reachable history and GitHub metadata, not only the current tree. Do not change repository visibility until the owner approves after the readiness review in docs/publication.md.
- Public CI uses standard hosted runners, pinned actions, read-only contents permission, no persisted checkout credentials or privileged execution of fork code. Upload only isolated verification evidence, not authored or private project files. Distinguish PR merge revision, topic head and main integration revision.

## Shared record commands
Use the same ellipsis menu for collection and record commands; never make a destructive row click or bypass the existing recovery-aware trash confirmation. Preserve filtered collection context after removal and expose restoration. Provide menu keyboard navigation, focus restoration and outside dismissal; test scroll clipping. Search relationship targets within valid typed endpoints and existing link constraints; do not silently truncate without a count/refine hint.

## Coherent delivery increments
- Group related implementation into an explicit Increment scoped by Contains relationships, linked from a Milestone. Use small focused commits within a coherent PR; do not require separate owner acceptance for every small slice. Tasks and acceptance tests are canonical records, not duplicated checklists. Keep authored status, linked changes, exact-revision automated evidence and latest acceptance decision separate. No inferred completion; delegated integration requires explicit developer review of each PR and current gates. Record missing scope/evidence explicitly.
- Inline/bulk property edits whitelist fields and enforce expected revision; skip unresolved recovery, bound selection to visible records and report independent acknowledgements, including partial or uncertain outcomes. Do not claim multi-file atomicity. Duplicates have new IDs, timestamps and Concept status; never copy scope, delivery evidence or acceptance state. Clipboard success requires acknowledgement.

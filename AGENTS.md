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

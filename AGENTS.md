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
- Run typecheck, unit/integration tests, build and runtime smoke tests on Windows and Linux, using the latest supported Node LTS and supported older lines. Do not claim a version combination is verified until checks actually pass.
- Keep dependency install-script approvals narrowly scoped to reviewed versions; review new scripts after every upgrade.

## Dogfooding
- Prism Development is the primary product and project workspace. Read .prism/records and .prism/views before choosing work. Keep planning status in records; docs/roadmap.md is an index only.
- Link each substantial change to a feature/task and milestone, write acceptance criteria and record revision-specific verification evidence. Use the workflow in docs/development-workflow.md.
- Treat the owner's edited records as real data. Inspect existing files before updating; do not reseed or overwrite the workspace. Never write automated tests against live workspace counts.
- Emberfall and Starter workspace remain reference projects; automated tests use controlled fixtures and temporary directories. Do not commit personal paths, credentials, private game assets or unrelated local project edits.

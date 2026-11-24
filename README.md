# Prism

**One source. Multiple perspectives.**

Prism is a local-first repository-native creative, product and project management workspace. Records are ordinary Markdown files with YAML metadata. Boards, tables, galleries and animated presentations are projections of those same records.

## Development preview

Prism is under active development, not a production release. The project's own source is licensed under [AGPL-3.0-only](LICENSE). Third-party components retain their respective licenses; users' independently authored project data is not licensed merely by using Prism. See [publication and verification policy](docs/publication.md).

Requires Node.js 22.12+ and npm.

```sh
npm ci
npm run dev
```

Open http://localhost:5173. The API listens only on 127.0.0.1:4174. The included `workspace/` is an illustrative demo, not your actual game data.

Use `PRISM_PROJECT=/absolute/path/to/project npm run dev` to select another folder. Prism creates its records directory if needed. For a built local preview, run `npm run build` then `npm start` and open http://127.0.0.1:4174.

```sh
npm test
npm run typecheck
npm run build
```

Tests use a separate frozen Emberfall fixture; edits to the example project do not affect test counts. Windows does not need Administrator privileges: file-symlink tests skip only when Windows refuses permission, while directory-junction tests still check linked-directory exclusion. Automatic hosted verification is configured for public PRs and main; private automatic runs remain disabled to avoid spending the private allowance. Until hosted checks are demonstrated and required, local verification remains the automated merge gate. Manual acceptance remains required independently; platform support claims require actual platform evidence.

Dependency policy: latest compatible stable releases, verified migrations and reproducible installs. See [dependency maintenance](docs/dependencies.md). For dependency review run `npm audit --json` and `npm audit --omit=dev --json`. Review advisory paths and proposed upgrades before using `npm audit fix`; do not force breaking upgrades indiscriminately. The committed npm lockfile is required by the local verifier; use npm ci for clean reproducible installs.

## Develop Prism with Prism

Run `npm run dev` from the repository root. The default workspace is **Prism Development**, with the real product vision, roadmap, backlog, requirements, decisions, verification evidence and saved views in `.prism/`. Emberfall and Starter workspace remain available in the project selector. See [development workflow](docs/development-workflow.md) and [roadmap index](docs/roadmap.md). The records are real planning data; tests must not depend on their live counts.

## Try the Emberfall reference project

A small Bevy game with connected game-design, product, engineering and project records is included under [examples/emberfall](examples/emberfall). Run `npm run dev` from the repository root; Prism automatically loads Prism Development, Emberfall and Starter workspace unless a custom project configuration takes precedence. See [the reference project guide](examples/README.md) for PowerShell, evaluation steps and separate-repository setup.

## Connect multiple projects

Clone your game separately; no Prism source code is needed in the game repo. Copy [examples/projects.yaml](examples/projects.yaml) to `.prism/projects.local.yaml`, set absolute paths to existing folders, then restart Prism. This local registry is discovered automatically. For an explicit override:

```sh
PRISM_PROJECTS=.prism/projects.local.yaml npm run dev
```

PowerShell: `$env:PRISM_PROJECTS=".prism/projects.local.yaml"; npm run dev`.

Registry precedence: PRISM_PROJECTS, PRISM_PROJECT, .prism/projects.local.yaml, .prism/projects.yaml, examples/bevy.projects.yaml, then the standalone workspace fallback. Paths are resolved relative to the launch directory. Invalid registries fail visibly instead of silently loading a demo. The project picker selects configured projects. Repository-mode records live in `<game>/.prism/records/`; keep those tracked in your game repo. Use [the ignore example](examples/connected-repo.gitignore) for generated caches and machine settings. Standalone mode preserves the previous `records/` layout. Paths are configured locally, not accepted by the browser. Profile labels are reserved for future profile-specific features; they do not yet activate adapters.

Repository view previews original documentation, source and manifest files in conventional folders. It does not execute scripts or generate Rust API documentation. Audit view checks missing descriptions and unresolved/self-referential record IDs. Source previews are read-only.

## Saved views and knowledge

Filter by type, status, priority and text; choose title, priority or status sorting. Save the configuration to a project-scoped YAML view, reopen it, update it or delete it without deleting any records. Emberfall includes four ready-made views. Wiki renders record Markdown; Relationships exposes direct links and labeled backlinks. Explicit implements, verifies, depends-on, blocks, documents and related-to edges coexist with legacy generic IDs. Repository Markdown can be toggled between rendered and source modes. No AI or compiler is used to generate these pages.

### Implemented in this first slice

- Four synchronized record views: board, table, gallery and slides; plus repository browser and record audit.
- Multi-project switching, isolated stores, expanded management entity types and editable record links.
- Shared inspector, record creation, status changes, search and explicit save.
- Markdown/YAML persistence, schema validation, revision checks and atomic file replacement.
- Periodic refresh of externally edited records; conflicting edits are rejected rather than silently overwritten.
- Local-only service with no account, database or cloud dependency.

### Scope and limitations

This is a development preview, not production-ready. There is no live multi-user collaboration, undo history, asset upload, drag-and-drop, custom schema editor, native desktop packaging or advanced motion timeline yet. Gallery artwork is generated from record metadata, not an asset browser. Git synchronization and backups are managed outside the app. Do not expose the local server to a network.

Read [architecture](docs/architecture.md), [roadmap](docs/roadmap.md) and [AGENTS.md](AGENTS.md). Prism's own source is licensed under AGPL-3.0-only; third-party terms remain applicable.

## Workspace navigation

Open the project Overview for current direction, milestones, blockers and work. Use purpose-oriented sections for product, management, knowledge, engineering and game design. Data library exposes all record types and flexible visualization modes; Saved views remain available as a collapsible navigation section. Expand an opened record using the editor's expand control. These built-in navigation profiles do not yet support custom navigation definitions.

## Delivery evidence

Repository-mode projects with independent Git metadata expose Engineering / Changes, linked commits in Work and record details, and a reconciliation section on Overview. Install Git and use commit-message trailers `Prism-Record: <record-id>`. Exact historical hashes can be authored in `implementationCommits` metadata. No remote calls, automatic task completion or CI import. Unlinked commits are not necessarily errors; history is bounded to the latest 100 HEAD-reachable commits.

## Local verification and review

Stop the development server, commit intended changes, and run `npm run verify` from the Prism repository. This performs npm ci (replaces node_modules), typecheck, tests, build and both dependency audits; the audits and installation need npm registry access or suitable cached packages. A nonzero exit is not a passing gate. The ignored report `.prism/cache/verification/latest.json` is displayed in Quality / Audit. It identifies the tested revision and recorded clean-tree checks, not current dirty state or manual acceptance. Hosted Actions run automatically for public pull requests and main; private automatic jobs are skipped, with manual dispatch available. Use [development workflow](docs/development-workflow.md) for PR review and history-preserving merges.

View tabs retain a consistent relative order across categories. Prism uses the recommended mode on first visit and remembers explicit mode choices per configured project and category in the current browser profile. Saved views still open with their authored mode. Preferences stay local and are not committed to Git.

Unsaved editor changes have browser-local recovery copies. Reopen a record to recover the draft; close retains it, while Discard draft explicitly removes it. Export draft produces a JSON copy. If the disk record changes, review field-level conflicts before saving. Browser-local recovery is not a backup or cross-device synchronization. Canonical saves still require current revision and validated input.
An opened editor stays available if its record disappears externally; saving remains blocked until the file is restored.

## Record navigation
Open records from Overview, collections or related links to read their content in the main workspace. Edit record / Resume draft explicitly opens the editor; closing returns to the record. Use Back/Forward or browser history to revisit prior pages; use breadcrumbs to return to the owning category or project Overview. Copy the fragment URL to reopen a specific project, collection, saved view or record. Overview / Awaiting acceptance and record Linked tests expose acceptance handoffs without searching saved views. History restores collection mode and filters; scroll restoration is best effort. Browser-local recovery remains distinct from saved Markdown.

## Acceptance review
For acceptance-tagged Test records with grouped case definitions, a connected Git repository supports native review runs. Start/resume from Overview or linked tasks, record case outcomes and notes, and explicitly finalize the review. Saved runs live in the ignored local `acceptance.local` directory and retain the exact Git and definition revisions; export JSON for sharing or backups. A passed review is manual evidence, not automatic merge approval. Unstructured tests remain readable. Short navigation and case transitions respect reduced motion.

The editor supports Cancel (restore pre-session draft), Keep draft & close and explicit Discard draft. Blocked navigation appears as a toast. Acceptance has Save & next and Copy review summary for deliberate PR/chat handoff. The local Playwright browser suite is locked and runs against isolated fixtures via `npm run test:browser`. Revision-specific verification and manual acceptance are tracked in Prism's records and the corresponding pull requests. See docs/development-workflow.md for exact tooling installation and isolated browser verification. Owner acceptance is five UX cases; technical regression coverage remains separate.

## Collection management
Use the left collection search, Filter, sort field and ascending/descending direction; Table headers toggle ordering. New is contextual and opens the editor; direct Edit actions are available across record views. Record pages offer Move to trash, with impact confirmation; Trash restores original records without overwriting an existing ID. Trash is tracked project data, not a permanent-delete operation. See the linked delivery and acceptance records for current review status.

Record commands use an ellipsis menu with Edit and Move to trash across record views. Collection removal stays in the current collection and offers View Trash after success. Relationship targets can be searched by title, ID, type or tags within compatible records. PR #11 was accepted and integrated.

## Record management and increments
Table supports inline status/priority and bounded visible-record multi-selection with a bulk preview and per-record outcomes. Record actions include Duplicate and Copy record link. Increments define explicit task/test scope through Contains relationships and show authored status, linked Git evidence, local npm/browser gates and revision-specific acceptance. The first dogfooding increment is Record management and interaction (PR #11). PR #11 passed owner-reported automated and manual acceptance and was merged.


## Register local projects

Use `npm run project -- list` and `npm run project -- add <id> <title> <existing-folder> <standalone|repository> <profiles>` with Prism stopped, then restart and select the registered project. See [local registration and settings](docs/project-registration.md) and [backup and restore](docs/backup.md).


## M1 knowledge and management workflows

The configurable knowledge and management baseline uses versioned project schemas, stable custom entity roles, reusable record templates, Inbox capture and triage, Data library search, configurable tables, Board status movement, Plan dependencies, Timeline authored dates and Traceability. Edit a canonical record once; views derive from saved project data. Use the Recovery workspace to find local drafts, the record editor for typed values and opt-in autosave, and definition form recovery for unfinished schema/entity/template inputs. Repository increments support explicitly authored pull request references and separately initiated hosted metadata lookups. Local project registration and backup commands are documented above. See [M1 scope and review readiness](.prism/records/m1-review-readiness.md) and [consolidated review](.prism/records/m1-milestone-acceptance.md); technical integration is not human acceptance.

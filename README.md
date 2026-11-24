# Prism

**One source. Multiple perspectives.**

Prism is a local-first repository-native creative, product and project management workspace. Records are ordinary Markdown files with YAML metadata. Boards, tables, galleries and animated presentations are projections of those same records.

## Development preview

Requires Node.js 22.12+ and npm.

```sh
npm install
npm run dev
```

Open http://localhost:5173. The API listens only on 127.0.0.1:4174. The included `workspace/` is an illustrative demo, not your actual game data.

Use `PRISM_PROJECT=/absolute/path/to/project npm run dev` to select another folder. Prism creates its records directory if needed. For a built local preview, run `npm run build` then `npm start` and open http://127.0.0.1:4174.

```sh
npm test
npm run typecheck
npm run build
```

Tests use a separate frozen Emberfall fixture; edits to the example project do not affect test counts. Windows does not need Administrator privileges: file-symlink tests skip only when Windows refuses permission, while directory-junction tests still check linked-directory exclusion. CI covers Linux and Windows on Node 22 and 26.

Dependency policy: latest compatible stable releases, verified migrations and reproducible installs. See [dependency maintenance](docs/dependencies.md). For dependency review run `npm audit --json` and `npm audit --omit=dev --json`. Review advisory paths and proposed upgrades before using `npm audit fix`; do not force breaking upgrades indiscriminately. A committed lockfile is needed for reproducible npm CI; it is not yet present.

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

Filter by type, status, priority and text; choose title, priority or status sorting. Save the configuration to a project-scoped YAML view, reopen it, update it or delete it without deleting any records. Emberfall includes four ready-made views. Wiki renders record Markdown; Relationships exposes direct links and backlinks. Repository Markdown can be toggled between rendered and source modes. No AI or compiler is used to generate these pages.

### Implemented in this first slice

- Four synchronized record views: board, table, gallery and slides; plus repository browser and record audit.
- Multi-project switching, isolated stores, expanded management entity types and editable record links.
- Shared inspector, record creation, status changes, search and explicit save.
- Markdown/YAML persistence, schema validation, revision checks and atomic file replacement.
- Periodic refresh of externally edited records; conflicting edits are rejected rather than silently overwritten.
- Local-only service with no account, database or cloud dependency.

### Scope and limitations

This is a development preview, not production-ready. There is no live multi-user collaboration, undo history, asset upload, drag-and-drop, custom schema editor, native desktop packaging or advanced motion timeline yet. Gallery artwork is generated from record metadata, not an asset browser. Git synchronization and backups are managed outside the app. Do not expose the local server to a network.

Read [architecture](docs/architecture.md), [roadmap](docs/roadmap.md) and [AGENTS.md](AGENTS.md). A project license is pending owner selection.

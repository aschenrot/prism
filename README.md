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
```

## Connect multiple projects

Clone your game separately; no Prism source code is needed in the game repo. Copy [examples/projects.yaml](examples/projects.yaml) to `.prism/projects.local.yaml`, set absolute paths to existing folders, then start:

```sh
PRISM_PROJECTS=.prism/projects.local.yaml npm run dev
```

PowerShell: `$env:PRISM_PROJECTS=".prism/projects.local.yaml"; npm run dev`.

The project picker selects configured projects. Repository-mode records live in `<game>/.prism/records/`; keep those tracked in your game repo. Use [the ignore example](examples/connected-repo.gitignore) for generated caches and machine settings. Standalone mode preserves the previous `records/` layout. Paths are configured locally, not accepted by the browser. Profile labels are reserved for future profile-specific features; they do not yet activate adapters.

Repository view previews original documentation, source and manifest files in conventional folders. It does not execute scripts or generate Rust API documentation. Audit view checks missing descriptions and unresolved/self-referential record IDs. Source previews are read-only.

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

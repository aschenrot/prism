# Prism

**One source. Multiple perspectives.**

Prism is a local-first creative workspace for game development. Records are ordinary Markdown files with YAML metadata. Boards, tables, galleries and animated presentations are projections of those same records.

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

### Implemented in this first slice

- Four synchronized views: board, table, gallery and slides.
- Shared inspector, record creation, status changes, search and explicit save.
- Markdown/YAML persistence, schema validation, revision checks and atomic file replacement.
- Periodic refresh of externally edited records; conflicting edits are rejected rather than silently overwritten.
- Local-only service with no account, database or cloud dependency.

### Scope and limitations

This is a development preview, not production-ready. There is no live multi-user collaboration, undo history, asset upload, drag-and-drop, custom schema editor, native desktop packaging or advanced motion timeline yet. Gallery artwork is generated from record metadata, not an asset browser. Git synchronization and backups are managed outside the app. Do not expose the local server to a network.

Read [architecture](docs/architecture.md), [roadmap](docs/roadmap.md) and [AGENTS.md](AGENTS.md). A project license is pending owner selection.

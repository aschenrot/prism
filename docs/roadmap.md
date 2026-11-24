# Roadmap

## 0 — Vertical slice (current proposal)
- Persistent records, shared inspector, search and four synchronized projections.
- Visual design tokens, keyboard-accessible navigation and motion-aware slides.
- Revision conflicts, validation, atomic replacement and storage tests.

## 1 — Editing and reliability
- Undo/redo, autosave with recovery, delete/archive, bulk edits, keyboard commands.
- External file watcher, incremental updates, independent backup/restore, schema migrations.
- JSON Schema entity definitions, relationship integrity, backlinks, saved view definitions.
- Real Markdown editor and safe rich-text preview; visible invalid-file recovery.

## 2 — Creative tools
- Asset import, media references, thumbnails, provenance and licensing.
- Kanban drag-and-drop with keyboard alternative, custom table columns and filters.
- React Flow + ELK for connected systems; evaluate Konva for freeform canvas.
- Timeline, moodboards, relationship graphs, custom dashboards.

## 3 — Presentation design
- Declarative slide layouts bound to records and saved queries; editable sequence.
- Speaker notes, full-screen navigation, motion presets and timeline controls.
- PDF/image export and animated video export; exports are immutable snapshots.
- Evaluate Reveal.js against the integrated renderer only when needed.

## 4 — Professional workflow
- Storybook, visual regression snapshots, Playwright and axe accessibility gates.
- CLI for validated batch edits and dry runs, optional MCP bridge.
- Optional 3D previews with Three.js, desktop shell, authenticated collaboration.

## Release gates
No data loss on ordinary saves; conflict errors are actionable; all projections update after mutation; keyboard and reduced-motion flows work; approved screenshots across viewport sizes; tests and builds pass.

# Prism product roadmap

Prism is a local-first repository-native knowledge and project workspace. One authoritative source for each fact; many synchronized perspectives.

## P0 — Foundation and multi-project
- [x] Initial Markdown/YAML storage, shared inspector and board/table/gallery/slides code.
- [x] Configured project registry, per-project routes and caches, repository-mode storage.
- [x] Read-only repository file browser, basic record audit, product/project entity types.
- [ ] Pass CI and local visual/interaction review; resolve verification failures.
- [ ] Persistent drafts, autosave/recovery, undo/redo, delete/archive and atomic batch edits.
- [ ] File watcher, backups, migration format, conflict UI and accessibility tests.
- [ ] Native project picker/registration with explicit filesystem grants.

## P1 — Knowledge and management
- [x] Saved views with status/priority/type filters, sorting, editable links and computed backlinks; record Wiki and Relationships views.
- Configurable JSON Schema entities and typed relationships, cross-record integrity.
- Universal inbox, templates, global search and rebuildable SQLite/FTS5 index.
- Product vision, research, objectives, requirements, features, milestones, risks and decisions.
- Dependency-aware tasks, roadmap/timeline, prioritization, traceability matrix, GitHub issues ownership policy.
- Acceptance: a requirement linked to an objective and task is editable once and changes all views.

## P2 — Repository intelligence and wiki
- Read-only Git adapter with commit provenance, diffs and historical snapshots.
- Rust cargo metadata, rustdoc extraction, semantic symbol index via rust-analyzer/SCIP or Tree-sitter.
- Bevy adapter for plugins, ECS components/resources/systems, explicit unknowns for dynamic registration.
- Generated wiki separated from human writing; source links, revision, freshness, reproducible extraction.
- Import CI test/coverage/licensing/security results (nextest, Clippy, cargo-deny, llvm-cov).
- Optional AI proposals, reviewable patches; no automatic execution of untrusted repository scripts.

## P3 — Creative workspace and visual quality
- Asset ingestion/references, thumbnails, provenance, licensing, duplicate detection.
- Moodboards, accessible drag-and-drop, relationship graphs, canvas and automatic layout.
- Reusable components and declarative visualization definitions: Gantt, matrix, Sankey, treemap, state diagrams, progression tree.
- Design tokens, Storybook, Playwright visual baselines, reduced motion and axe accessibility checks.

## P4 — Presentations and publishing
- Data-bound slide layouts, sequence, speaker notes, fullscreen, transitions and motion controls.
- Reports, game design docs, static wiki, HTML, PDF and video export as revisioned snapshots.
- Reuse React components; evaluate Reveal.js only if needed.

## P5 — Audits and automation
- Configurable rules for traceability, missing assets, stale docs, dependencies and release readiness.
- Evidence and severity per finding, transparent criteria; no ungrounded aggregate scores.
- Trigger/condition/action workflows; approval for writes, dry-run previews and job history.
- Git time machine and impact analysis.

## P6 — Game-specific tools
- Data-driven combat/economy/progression/loot simulations with verified game formulas.
- Crafting, skill trees, dialogue, state graphs and balancing tables; RON/TOML/JSON adapters.
- Optional Bevy Remote Protocol integration, development-only and read-only by default.
- Three.js model previews, audio waveforms, profiling imports.

## P7 — Extensibility and optional collaboration
- Internal adapter/analyzer/editor/view/export contracts, then versioned SDK and explicit permissions.
- Validated CLI and optional MCP bridge; optional local or remote AI.
- Desktop packaging, authenticated remote access and collaborative conflict handling only after storage guarantees.

## Release gates
Passing build/tests; no ordinary-save data loss; project isolation; clear conflicts and recovery; keyboard access and reduced motion; approved screenshots; generated content reproducible and distinguishable from canonical source.

Checked items mean code committed, not verified production readiness.

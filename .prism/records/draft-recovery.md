---
id: draft-recovery
type: Task
title: Recover unsaved drafts and review external conflicts
status: In progress
priority: High
accent: teal
tags: [current, quality, implementation]
relationships:
  - kind: implements
    target: editing-reliability
  - kind: implements
    target: data-integrity
  - knowledge-engine
---
PR #2 scope: keep a versioned recovery copy in browser-local storage per project and record, including base revision and editable baseline. Reopening a record restores unsaved input, even temporarily invalid title/tag text. Closing a dirty editor retains confirmed recovery rather than discarding it. Explicit discard and JSON export remain available. Storage failures and competing local draft edits are visible and prevent silent close. External revisions use a three-way field comparison; overlapping fields require explicit disk/local choices; applying the resolution changes the draft base, never the canonical record. Saving still requires schema validation and expected revision. A server 409 triggers refresh without discarding the draft.

## Acceptance
- Edit a disposable record, close and reopen, reload browser and reopen: recover text and metadata without changing canonical Markdown.
- Save normally and verify recovery is cleared only after successful save; discard explicitly; test incomplete inputs.
- Edit the same record externally: non-overlapping fields combine only after explicit review; overlapping fields require choices. A second disk change still rejects stale saves.
- Storage unavailable/full and competing-tab edits are visible; export local copy; no silent overwrite of newer recovery data.
- Scope by project and record; no new dependencies or Git-tracked draft files.
- Verify automated tests, browser behavior and a clean local gate before merging.

Limitations: browser storage is not a backup or cross-machine sync; no atomic browser-tab lock, orphan draft browser, automatic save, undo/redo or text-level merge. An already-open record keeps its editor mounted if its canonical file disappears or becomes malformed; save is disabled and draft export remains available. After closing or restarting, restore the file before reopening an orphan draft. Registry project IDs must remain stable; reuse of a project ID may reveal prior browser-local recovery. Manual acceptance pending.

- Manual acceptance additionally covers external removal of the selected file: editor stays open, export remains possible, and save is disabled until a valid record returns.

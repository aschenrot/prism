---
id: draft-recovery
type: Task
title: Recover unsaved drafts and review external conflicts
status: Ready
priority: High
accent: teal
tags: [quality, implementation]
relationships:
  - kind: implements
    target: editing-reliability
  - kind: implements
    target: data-integrity
  - knowledge-engine
  - editor-acceptance
---
PR #9 implementation scope: keep a versioned recovery copy in browser-local storage per project and record, including base revision and editable baseline. Reopening a record restores unsaved input, even temporarily invalid title/tag text. Closing a dirty editor retains confirmed recovery rather than discarding it. Explicit discard and JSON export remain available. Storage failures and competing local draft edits are visible and prevent silent close. External revisions use a three-way field comparison; overlapping fields require explicit disk/local choices; applying the resolution changes the draft base, never the canonical record. Saving still requires schema validation and expected revision. A server 409 triggers refresh without discarding the draft.

## Acceptance
- Edit a disposable record, close and reopen, reload browser and reopen: recover text and metadata without changing canonical Markdown.
- Save normally and verify recovery is cleared only after successful save; discard explicitly; test incomplete inputs.
- Edit the same record externally: non-overlapping fields combine only after explicit review; overlapping fields require choices. A second disk change still rejects stale saves.
- Storage unavailable/full and competing-tab edits are visible; export local copy; no silent overwrite of newer recovery data.
- Scope by project and record; no new dependencies or Git-tracked draft files.
- Verify automated tests, browser behavior and a clean local gate before merging.

Limitations: browser storage is not a backup or cross-machine sync; no atomic browser-tab lock, orphan draft browser, automatic save, undo/redo or text-level merge. An already-open record keeps its editor mounted if its canonical file disappears or becomes malformed; save is disabled and draft export remains available. After closing or restarting, restore the file before reopening an orphan draft. Registry project IDs must remain stable; reuse of a project ID may reveal prior browser-local recovery. Manual acceptance pending.

- Manual acceptance additionally covers external removal of the selected file: editor stays open, export remains possible, and save is disabled until a valid record returns.

Current review: implementation at 742f7846e049c13dc63f026a37bd12d56ccb48e5 is in draft PR #9. Follow editor-acceptance for the canonical actionable checklist and actual outcomes. Implementation remains In progress until accepted; no test is pre-marked passed.

Navigation follow-up: canonical records now open read-only in the main workspace. Edit record or Resume draft explicitly opens the recoverable editor, and close returns to reading. Review record-navigation and the expanded editor-acceptance checklist together.

Cancellation now restores the session-entry recovery checkpoint (or removes newly created recovery if none existed). Explicit Discard draft remains distinct. Failed recovery restoration leaves the current editor available unless the owner explicitly confirms leaving without changing the stored recovery. Navigation warning is a floating dismissible toast; editor data stays mounted. See browser-verification for prepared regression coverage.

## Accepted implementation scope
Accepted PR #9: exact tested head 0c4d03ace85ded796fb981168727e1bf7891557c; owner reported clean npm and browser gates passed, uploaded review run 60e72b29-6c93-4d5f-9533-8cf5d6504301 with U01–U05 Passed, and explicitly approved final acceptance and regular merge in chat on 2026-11-24. Merge a06c1cf662775dccdab394379d84ec3d1f215aab has the same tree as tested head. The uploaded run itself had decision open; final approval was separately recorded in PR #9. This is historical evidence of the accepted slice, not verification of subsequent changes. Remaining technical coverage gaps remain in editor-regression-spec.

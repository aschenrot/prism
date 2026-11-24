---
id: editor-acceptance
type: Test
title: "Acceptance checklist — editor reliability (PR #9)"
status: "In progress"
priority: High
accent: teal
tags: [current, acceptance, quality, manual]
relationships:
  - kind: verifies
    target: editing-reliability
  - kind: verifies
    target: data-integrity
  - draft-recovery
  - knowledge-engine
  - quality-gates
  - record-navigation
---
## Review instructions
Tester: project owner. PR: https://github.com/aschenrot/prism/pull/9
Implementation under review: draft recovery at 742f7846e049c13dc63f026a37bd12d56ccb48e5 plus the navigation and acceptance follow-up in PR #9. Record the exact tested branch HEAD below, not an assumed implementation hash.

Use a new disposable record in a scratch project (or create a uniquely named throwaway record in Starter workspace). Never edit or delete existing Prism planning records or game assets for destructive tests. Stop dev before running npm run verify, run it from a clean committed checkout, then start dev. Keep the test record In progress until all applicable required checks pass and the owner explicitly accepts; record failed or blocked cases with expected/actual behavior. A verifies edge is a test relationship, not evidence of passage.

The checklist checkboxes are read-only today. From Overview / Awaiting acceptance, or from the draft-recovery task's Linked tests section, open this test as a full-page record. Choose Edit checklist, change [ ] to [x] in Notes only after a check passes, and save. Alternatively report case IDs and observed results in review; do not mark an unperformed check passed. Run the clean-revision verification before saving checklist results, because saving changes tracked Markdown and makes the worktree dirty. Review any acceptance-only record changes separately; never stage scratch records or unrelated user data.

## A. Automated gate
- [ ] A01 — On feat/editor-reliability with a clean working tree, run npm run verify. Expected: clean install, typecheck, tests, production build and both audits succeed; final output identifies the exact clean revision. Record skips and warnings.
- [ ] A02 — Start npm run dev; open Prism Development > Quality > Audit. Expected: report shows the tested revision, environment and six check outcomes; no assertion that manual acceptance passed.

## B. Draft lifecycle
- [ ] B01 — Create a uniquely named disposable record; save an initial title and notes. Open Edit record, then change title and notes without Save. Expected: recovery copy reported stored; canonical Markdown still contains initial text.
- [ ] B02 — Use Keep draft & close, then choose Resume draft on the record page. Expected: exact unsaved title and notes return and editor remains dirty.
- [ ] B03 — Reload browser (accept unsaved warning if shown), reopen same record and choose Resume draft. Expected: unsaved changes return, not the old saved values.
- [ ] B04 — Temporarily clear the title and enter an unfinished comma-separated tag. Close and choose Resume draft. Expected: unfinished input remains recoverable; canonical Save requires valid input. Correct input afterward.
- [ ] B05 — Save the recovered valid draft. Close/reopen. Expected: canonical Markdown reflects saved edits; no unsaved recovery indicator.
- [ ] B06 — Change notes again; choose Discard draft and confirm. Expected: saved values restored; closing and reopening does not recover discarded edits. Canceling the discard prompt first must retain edits.
- [ ] B07 — Edit notes and export draft. Expected: JSON contains current local edit, base revision and record ID; canonical Markdown unchanged.

## C. External changes and conflicts
For these cases, keep a copy of the disposable record file. Edit the correct file in your external text editor, preserving valid YAML and ID; wait for the app's record refresh (normally about 2.5 seconds). Do not use production records.
- [ ] C01 — Change notes in Prism without saving, then change only priority in the file on disk. Expected: review appears with no overlapping field edits; apply review and save. Both new notes and disk priority survive.
- [ ] C02 — Change title in Prism and change title differently on disk. Expected: Save blocked; choose current disk or my draft for Title. Before applying, confirm no canonical write occurs. Apply, save and inspect file.
- [ ] C03 — Repeat C02 using the other choice. Expected: chosen value retained; other independently changed fields preserved.
- [ ] C04 — During review, make another valid external change. Expected: review updates for the latest revision; an older expected revision cannot overwrite newer disk data. If the timing produces a server conflict, the draft remains intact.
- [ ] C05 — While dirty, temporarily rename the disposable .md file away from records (keep original bytes). Expected: editor remains open, Save disabled, recovery/export available. Restore file; review any change and save only after valid record returns.

## D. Recovery boundaries and usability
- [ ] D01 — Open Edit record for the same disposable record in two browser tabs before either edits. Make a local draft in one and a different local draft in the other. Expected: competing recovery is reported in the second editor; it does not silently overwrite the first. Export the second draft before discarding it. Do not assume this is a cross-tab lock.
- [ ] D02 — With another isolated browser profile or browser storage controls, make storage unavailable, if supported. Expected: recovery warning, draft remains in editor, export remains available, and dirty close does not silently discard input. If this environment cannot reproduce the condition, note it as blocked and retain the automated storage-failure test evidence.
- [ ] D03 — Open a record in another project after retaining the first draft. Expected: no cross-project recovery; reopening the original project/record recovers only its own draft.
- [ ] D04 — Use keyboard Tab/Enter/Space to reach Save, keep/close, discard and conflict choices. Expand/collapse editor and narrow the browser. Expected: controls reachable, focus visible, draft preserved and conflict text readable.

## E. Navigation and reading
- [ ] E01 — From Overview / Active work, open Recover unsaved drafts. Expected: readable full-page task with title, metadata, content and linked tests; no automatic editor or narrow inspector.
- [ ] E02 — Open the linked acceptance test directly from the task, then use app Back and Forward. Expected: previous task and test pages return in visit order. Overview / Awaiting acceptance also opens the test directly.
- [ ] E03 — From a record, click the category breadcrumb, then the project breadcrumb. Expected: owning category and Overview respectively. Browser Back returns to the previous visit, not necessarily the parent category.
- [ ] E04 — In Work choose a mode, search, status/priority filters and sort; scroll down and open a visible record. Use native browser Back. Expected: former mode, filters, sort and document scroll restored as content permits. Repeat with a saved view and Wiki reader selection.
- [ ] E05 — Copy a record URL into a new tab and reload it. Expected: exact project and stable record open in reading mode; no automatic editor. Try an unavailable record or project ID; expected clear recovery action, not silent substitution.
- [ ] E06 — In a disposable record, open Edit record and make unsaved changes. Try sidebar, breadcrumb and browser Back. Expected: stay in editor with recovery/guard notice and unchanged input. Keep draft & close, then navigate; reopen and Resume draft. Expected: input recovered. Also try project switching and editing after returning via history.
- [ ] E07 — Switch projects using the picker, then browser Back/Forward. Expected: correct project with isolated data and previous collection context. Use keyboard to follow breadcrumb and record links and inspect narrow layouts; verify focus moves to main content without unexpected view flashes.

## Results
- Tested revision: pending
- Environment: pending
- Automated report: pending
- Failed or blocked case IDs and observed behavior: pending
- Owner decision: pending
- Evidence/review notes: pending

Do not change this test to Ready based only on a successful build. After acceptance, link the tested revision and actual results in the PR; use a regular history-preserving merge commit.

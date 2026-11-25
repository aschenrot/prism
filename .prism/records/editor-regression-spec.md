---
id: editor-regression-spec
type: Document
title: Editor reliability regression specification
status: In progress
priority: High
accent: teal
tags: [quality, regression, specification]
relationships:
  - editor-acceptance
  - browser-verification
  - draft-recovery
  - record-navigation
  - acceptance-workspace
  - m1-functional-verification
---
## Purpose
Preserve the 31 original technical checks from editor-acceptance at 86b85781646721e5d95b0332af5a1e799f2325cf. These are regression requirements, not a second mandatory owner checklist and not results. The owner evaluates the smaller UX acceptance record; developer-owned automated checks and any uncovered risks remain separate.

## Initial automation coverage
- npm run verify: A01; unit tests for record and view persistence, conflict reconciliation, project scope, validated history and recovery storage, acceptance run persistence and decision rules.
- Browser test "cancel fresh edits...": cancel fresh and resumed sessions, B02, canonical preservation, earlier recovery checkpoint.
- "recover incomplete edits...": B01/B02/B03/B04/B05, including empty title and notes.
- "blocked navigation...": E01/E02/E03/E04/E06 in part; new toast and saved search restoration.
- "nonoverlapping external changes...": C01/C02, canonical merge and explicit choice.
- "a missing canonical file...": C05.
- "competing tabs...": D01 and partial D03.
- "review saves and advances...": F01/F02/F03 in part, result persistence, validation, final decision and Save & next; new copy-summary control is visible, not clipboard-tested.
- New unit tests: session-checkpoint comparison and recovery restoration; sanitized revision-specific review summary with actual pending/failed cases.

Coverage is not yet exhaustive: complete tag-input cases, discard/export downloads, alternative disk choice and repeated conflicts in the browser, storage unavailable in browser, same-ID cross-project isolation in browser, full native popstate/new-tab/saved-view/reader/scroll behavior, competing and historical review tabs, screenshot/visual comparisons and accessibility automation are still open. Some underlying rules are covered by unit tests. Do not mark any missing or unexecuted case passed. Before merge, assess remaining risks and record any explicit limits; no implied full regression coverage.

## Observed initial run
Owner-reported diagnostic run, 2026-11-24, Git HEAD d03af8ed2e2a6c5d4a1e79a2a06d70ec06aa493d, Windows x64 Node v26.13.1, Playwright 1.65.1 Chromium: all seven browser scenarios passed in 19.4 seconds; zero failed, flaky or skipped. Build and browser exit codes 0; cleanAtStart and cleanAtEnd both false; eligible false. Report directory 9b8e2d6d-b7b2-4630-9037-7183e1ec7669. npm verification: 234 packages installed, typecheck and production build passed, 44 tests (42 passed, one failed, one expected Windows file-symlink permission skip), both audits zero vulnerabilities. Failed assertion in review-summary escaping caused by escaping the # of an already generated numeric entity. Corrected with a single-pass transformation and added regression coverage. The dirty-tree results do not establish a passing clean-revision gate. No manual UX approval supplied.

## A. Automated gate
- [ ] A01 — **Run local verification** — On feat/editor-reliability with a clean working tree, run npm run verify. Expected: clean install, typecheck, tests, production build and both audits succeed; final output identifies the exact clean revision. Record skips and warnings.
- [ ] A02 — **Inspect the verification report** — Start npm run dev; open Prism Development > Quality > Audit. Expected: report shows the tested revision, environment and six check outcomes; no assertion that manual acceptance passed.

## B. Draft lifecycle
- [ ] B01 — **Preserve unsaved changes** — Create a uniquely named disposable record; save an initial title and notes. Open Edit record, then change title and notes without Save. Expected: recovery copy reported stored; canonical Markdown still contains initial text.
- [ ] B02 — **Recover after closing** — Use Keep draft & close, then choose Resume draft on the record page. Expected: exact unsaved title and notes return and editor remains dirty.
- [ ] B03 — **Recover after reload** — Reload browser (accept unsaved warning if shown), reopen same record and choose Resume draft. Expected: unsaved changes return, not the old saved values.
- [ ] B04 — **Recover incomplete input** — Temporarily clear the title and enter an unfinished comma-separated tag. Close and choose Resume draft. Expected: unfinished input remains recoverable; canonical Save requires valid input. Correct input afterward.
- [ ] B05 — **Save recovered draft** — Save the recovered valid draft. Close/reopen. Expected: canonical Markdown reflects saved edits; no unsaved recovery indicator.
- [ ] B06 — **Discard a draft** — Change notes again; choose Discard draft and confirm. Expected: saved values restored; closing and reopening does not recover discarded edits. Canceling the discard prompt first must retain edits.
- [ ] B07 — **Export a draft** — Edit notes and export draft. Expected: JSON contains current local edit, base revision and record ID; canonical Markdown unchanged.

## C. External changes and conflicts
For these cases, keep a copy of the disposable record file. Edit the correct file in your external text editor, preserving valid YAML and ID; wait for the app's record refresh (normally about 2.5 seconds). Do not use production records.
- [ ] C01 — **Combine independent changes** — Change notes in Prism without saving, then change only priority in the file on disk. Expected: review appears with no overlapping field edits; apply review and save. Both new notes and disk priority survive.
- [ ] C02 — **Resolve overlapping changes** — Change title in Prism and change title differently on disk. Expected: Save blocked; choose current disk or my draft for Title. Before applying, confirm no canonical write occurs. Apply, save and inspect file.
- [ ] C03 — **Verify the alternative resolution** — Repeat C02 using the other choice. Expected: chosen value retained; other independently changed fields preserved.
- [ ] C04 — **Handle repeated external changes** — During review, make another valid external change. Expected: review updates for the latest revision; an older expected revision cannot overwrite newer disk data. If the timing produces a server conflict, the draft remains intact.
- [ ] C05 — **Protect a missing record** — While dirty, temporarily rename the disposable .md file away from records (keep original bytes). Expected: editor remains open, Save disabled, recovery/export available. Restore file; review any change and save only after valid record returns.

## D. Recovery boundaries and usability
- [ ] D01 — **Handle competing browser tabs** — Open Edit record for the same disposable record in two browser tabs before either edits. Make a local draft in one and a different local draft in the other. Expected: competing recovery is reported in the second editor; it does not silently overwrite the first. Export the second draft before discarding it. Do not assume this is a cross-tab lock.
- [ ] D02 — **Handle unavailable storage** — With another isolated browser profile or browser storage controls, make storage unavailable, if supported. Expected: recovery warning, draft remains in editor, export remains available, and dirty close does not silently discard input. If this environment cannot reproduce the condition, note it as blocked and retain the automated storage-failure test evidence.
- [ ] D03 — **Isolate project drafts** — Open a record in another project after retaining the first draft. Expected: no cross-project recovery; reopening the original project/record recovers only its own draft.
- [ ] D04 — **Keyboard and responsive editing** — Use keyboard Tab/Enter/Space to reach Save, keep/close, discard and conflict choices. Expand/collapse editor and narrow the browser. Expected: controls reachable, focus visible, draft preserved and conflict text readable.

## E. Navigation and reading
- [ ] E01 — **Open a full record page** — From Overview / Active work, open Recover unsaved drafts. Expected: readable full-page task with title, metadata, content and linked tests; no automatic editor or narrow inspector.
- [ ] E02 — **Back, Forward and linked review** — Open the linked acceptance test directly from the task, then use app Back and Forward. Expected: previous task and test pages return in visit order. Overview / Awaiting acceptance also opens the test directly.
- [ ] E03 — **Navigate the breadcrumbs** — From a record, click the category breadcrumb, then the project breadcrumb. Expected: owning category and Overview respectively. Browser Back returns to the previous visit, not necessarily the parent category.
- [ ] E04 — **Restore collection context** — In Work choose a mode, search, status/priority filters and sort; scroll down and open a visible record. Use native browser Back. Expected: former mode, filters, sort and document scroll restored as content permits. Repeat with a saved view and Wiki reader selection.
- [ ] E05 — **Open a direct record link** — Copy a record URL into a new tab and reload it. Expected: exact project and stable record open in reading mode; no automatic editor. Try an unavailable record or project ID; expected clear recovery action, not silent substitution.
- [ ] E06 — **Protect unsaved edits during navigation** — In a disposable record, open Edit record and make unsaved changes. Try sidebar, breadcrumb and browser Back. Expected: stay in editor with recovery/guard notice and unchanged input. Keep draft & close, then navigate; reopen and Resume draft. Expected: input recovered. Also try project switching and editing after returning via history.
- [ ] E07 — **Restore project navigation** — Switch projects using the picker, then browser Back/Forward. Expected: correct project with isolated data and previous collection context. Use keyboard to follow breadcrumb and record links and inspect narrow layouts; verify focus moves to main content without unexpected view flashes.

## F. Native acceptance and motion
Use this real review for normal progress checks. For destructive or conflicting review operations, create a disposable Test record in an independent scratch Git repository configured in the local registry. Give it the acceptance tag and two cases using the same heading and case syntax. Never change the active development branch or live acceptance definition just to simulate a conflict.
- [ ] F01 — **Start a structured review** — Follow Start acceptance from the task; enter reviewer and environment. Expected: native case navigator, separate action and expected-result sections, exact recorded Git revision, and all cases Pending initially.
- [ ] F02 — **Save and resume observations** — Perform and save a real case; select another, leave the review, then reopen it and reload the browser. Expected: stored progress and notes persist, selected case is restored when available, and the canonical test record is unchanged.
- [ ] F03 — **Validate result and decision rules** — In a disposable review, select Failed or Blocked with empty notes; try acceptance while cases remain Pending. Expected: save requires observations; final acceptance requires every case Passed and explicit decision notes. Request changes and confirm; finalized run is read-only. Start another run; old results remain.
- [ ] F04 — **Protect concurrent and historical runs** — In a disposable review, open two tabs and save conflicting case edits; then change the disposable test definition and refresh. Expected: stale updates rejected, unsaved observations remain available until explicitly discarded, and prior definition/HEAD results are historical and read-only; no result is copied into a new run.
- [ ] F05 — **Inspect coherent navigation motion** — Navigate task to acceptance, Back and Forward, change cases and return. Repeat with OS/browser reduced motion enabled. Expected: short subtle content transitions, stable sidebar/breadcrumb and no incorrect intermediate view; reduced motion removes the animation. Keyboard focus remains usable.
- [ ] F06 — **Export review evidence** — Export results after saving a case; inspect JSON and local project acceptance.local files. Expected: exact test-definition revision, tested HEAD, case observations, reviewer, environment and decision present; Git status shows no acceptance-run files. Preserve exports for review/backup; no automatic task status or PR changes.




## G. Collection control ownership (M1 correction)
Automated browser regression: navigate all product/management/knowledge/configuration sidebar destinations using isolated fixtures, with ordinary and reduced motion. Verify exactly one live collection toolbar and search input in collection views, correct contextual creation label and empty query on new destinations; zero collection controls on dedicated destinations and full record pages. Verify Back restores the saved query, switching project does not carry stale controls, and dedicated project Search is distinct. Secondary record sections default closed; keyboard activation and reload preserve canonical data. This is developer-owned technical verification, not additional owner acceptance.


## H. Developer-owned M1 verification map
The former detailed H01–H04, R01–R02 and K01–K19 scope is now developer-owned. The current owner review is P01–P05; see m1-functional-verification for the exact archived cases and coverage mapping. Do not ask the owner to simulate filesystem corruption, competing writes or invalid provider responses. The following implementation tests carry those repeatable technical checks (the full matrix must pass on the actual candidate):
- H01–H04: hosted-verification.test.ts, pullReferenceEditing.test.ts and browser scenarios for opt-in hosted verification, scoped PR jobs and reference authoring. Browser provider responses are controlled fixtures; real hosted lookup remains a product observation.
- R01–R02: routes.test.ts, navigation.test.ts, views.test.ts, record-management.test.ts, trash.test.ts, editor.test.ts and browser navigation, menus, sorting, conflicts, missing files, duplication, trash, disclosure and sidebar scenarios.
- K01/K02/K17: integration browser scenario for one canonical requirement edit, traceability.test.ts, relationship/navigation/browser regressions. Visual cohesion remains human judgment.
- K03–K06: custom-properties.test.ts, tableColumns.test.ts and browser schema/identity/columns cases including retirement and stale writes.
- K07–K12: search.test.ts, templates.test.ts, inbox.test.ts, dependencyPlan.test.ts, timeline.test.ts and corresponding browser scenarios; board movement browser checks cover revision and recovery guards.
- K13–K14/K18–K19: draftHistory.test.ts, autosave.test.ts, draftInventory.test.ts, definitionRecovery.test.ts and related browser scenarios.
- K15–K16: projectBackup.test.ts, localRegistry.test.ts, registry.test.ts, projects.test.ts; exact bytes, incomplete backups/restores, unsafe links/roots, registry isolation and startup preflight. CLI usability remains a product judgment, not a claim that a unit test is a human review.

No automated result is a human acceptance observation. Historical owner results remain associated with their original revision and definition.


The revised developer scope includes an actual subprocess CLI backup/restore/registration round trip; a browser check that finalized reviews with replaced definitions remain unchanged while the new five-case review starts at zero; and game-profile navigation with a narrower desktop viewport. Passing screenshots are inspected from isolated fixtures. These checks complement rather than replace the original suite. Do not infer universal accessibility, live provider reliability or unsupported viewport/platform coverage.

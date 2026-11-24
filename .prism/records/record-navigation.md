---
id: record-navigation
type: Task
title: Addressable record pages and reliable workspace navigation
status: Ready
priority: High
accent: teal
tags: [design, usability, implementation]
relationships:
  - kind: implements
    target: ux-navigation
  - knowledge-engine
  - draft-recovery
  - editor-acceptance
  - visual-quality
---
Owner feedback: selecting active work on Overview opens a narrow property inspector, and the breadcrumb does not navigate. The primary action must open readable record content. Navigation and editing are distinct.

Implementation in PR #9: project, category, saved view and record addresses use hash-based routes (no production-server fallback or added router dependency); stable record IDs remain independent of their title/type. Back/Forward use browser history. Breadcrumb links go to the project's Overview and the record type's available category (Data library fallback). Collection entries retain mode, filters, sorting, reader focus, slide index and best-effort vertical scroll. Explicit record Edit/Resume draft reuses the existing recoverable editor within main content; sidebar/topbar remain available. In-app transitions and managed browser traversal are blocked while dirty/pending until the editor is saved or explicitly closed with confirmed recovery. Related record and test links open readable detail pages; Overview exposes open acceptance-tagged Test records. Actual acceptance remains manual; no automated status changes.

Acceptance: see editor-acceptance for UX review and section E of editor-regression-spec for technical cases. Regression tests cover route parsing, stable identity, fallback parent, validated collection/saved-view context and traversal decisions. Browser behavior, focus/scroll and complete acceptance are pending. Native structured case execution is implemented in acceptance-workspace; an optional quick inspector and further specialized detail schemas remain follow-up work. Hash URLs are portable between dev and built preview at the current origin; repository-file browser internal selection is not yet part of history.

Follow-up motion: route visits use a short 160ms entrance transition, reverse direction on Back, no animation on polling/filter changes, reduced-motion support. No browser visual validation yet.

Navigation guard feedback uses a dismissible floating toast instead of shifting the workspace or putting warnings in the project switcher. Back/Forward and project selection attempts use the same guard. Cancel editing restores the session-entry draft, rather than clearing previously retained work.

## Accepted implementation scope
Accepted PR #9: exact tested head 0c4d03ace85ded796fb981168727e1bf7891557c; owner reported clean npm and browser gates passed, uploaded review run 60e72b29-6c93-4d5f-9533-8cf5d6504301 with U01–U05 Passed, and explicitly approved final acceptance and regular merge in chat on 2026-11-24. Merge a06c1cf662775dccdab394379d84ec3d1f215aab has the same tree as tested head. The uploaded run itself had decision open; final approval was separately recorded in PR #9. This is historical evidence of the accepted slice, not verification of subsequent changes. Remaining technical coverage gaps remain in editor-regression-spec.

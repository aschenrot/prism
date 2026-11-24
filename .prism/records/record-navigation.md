---
id: record-navigation
type: Task
title: Addressable record pages and reliable workspace navigation
status: In progress
priority: High
accent: teal
tags: [current, design, usability, implementation]
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

Acceptance: see section E of editor-acceptance. Regression tests cover route parsing, stable identity, fallback parent, validated collection/saved-view context and traversal decisions. Browser behavior, focus/scroll and complete acceptance are pending. Native structured case execution, an optional quick inspector, and specialized type-specific detail schemas remain follow-up work. Hash URLs are portable between dev and built preview at the current origin; repository-file browser internal selection is not yet part of history.

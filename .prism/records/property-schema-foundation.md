---
id: property-schema-foundation
type: Task
title: Versioned property definitions and recoverable schema-driven editing
status: In progress
priority: High
accent: amber
tags: [current, knowledge, implementation]
relationships:
  - kind: implements
    target: custom-schemas
  - project-property-increment
  - m1-milestone-acceptance
  - editing-reliability
---
Acceptance criteria: absent schema remains backward compatible; version-1 file supports stable-ID text, finite number, date, boolean, enum and project record reference fields with optional built-in type scope. Schema-driven editor and readout show active fields, preserve inactive values, reject invalid changed values, cross-project links, unconfigured edits and stale record/schema revisions. Old draft recovery and ordinary mutations preserve unrelated metadata. Invalid schema blocks only custom changes. No implicit migration or copy of custom values during duplication. Tests cover structural/semantic validation, isolated filesystem, project isolation and browser recovery. M1 owner review pending; technical verification required.

## First hosted attempt
Run 45453437198: npm verification passed on all four platforms; Ubuntu browser failure at exact Confidence field label (new native select), while 18 existing scenarios passed. Explicitly label each schema control with its configured field label, preserving exact-name browser coverage. Re-run full matrix; no test weakening or timeout increase.

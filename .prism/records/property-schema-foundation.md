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

## Integrated technical evidence
PR #16 merged at 5a09cfa376e31d82350de225bb7a18efa895ee39, identical tested tree. Required run 45453922493 at topic 4a1c6f55017cad169e99e6bbf17b1c0ffe2b2d61 and checkout 92a7bdb658c28e4c34355cd24235842b693c1e11: all four jobs passed 67/67 unit and 19/19 browser scenarios, no failures/skips/flakes, clean eligible reports, both audits zero vulnerabilities. Direct logs inspected. Human milestone acceptance remains pending. Schema administration and entity type support remain separate tasks.

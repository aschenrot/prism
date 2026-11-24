---
id: property-schema-management
type: Task
title: In-app schema administration and configurable entity types
status: In progress
priority: High
accent: amber
tags: [knowledge, product]
relationships:
  - kind: implements
    target: custom-schemas
  - kind: depends-on
    target: property-schema-foundation
  - project-property-increment
  - m1-milestone-acceptance
---
Provide project-scoped schema editing with explicit revision checks, usage awareness, safe field/option renaming, non-destructive deprecation, and clear impact preview. Design custom record type identity independently of built-in Task, Test, Milestone and Increment semantics; avoid rewriting old records or breaking saved views. Schema migration that removes or converts values requires separate owner-approved review. Preserve stable IDs and avoid arbitrary code. Refine implementation scope before coding.

## Administration slice
Schemas workspace for each project: create stable-ID typed fields, edit labels, append or relabel choice options, retire/reactivate without removing stored values, and show loaded active usage counts. Existing IDs, kinds, type scopes, target scopes and choice IDs are immutable through in-app commands. No destructive deletion even at zero visible usage. Revision-bound schema writes serialized with record edits; exclusive creation and pre-publication recheck. Malformed external schema must be repaired without overwrite. Unsaved form input stays mounted on conflict and navigation is guarded; no claim of schema form reload recovery. Custom entity kinds remain a subsequent slice. Verification pending.

## First hosted attempt
Run 45454524759: unit/build/audit gates passed; new browser scenario observed successful schema creation and record property save, but could not navigate back because sidebar hard-coded group list omitted Configuration. Define canonical typed navigationGroups in shared navigation and render it in App. Preserve browser navigation assertion. Main run 45454428447 passed all four jobs after PR #16. Fresh matrix required.

## Technical integration
PR #17 merged at 007d4ede8d6f38185e8e07a0fa5074e33caa21f7, identical verified tree. Run 45455067554 at topic 2df809e71b2b8b2effc554b05933876cd2199d5f and synthetic checkout 3731e6585caad579b697969a93a3aec2e0f77279: all four jobs passed 69 unit tests and 20 browser scenarios, zero failed/flaky/skipped, both audits zero vulnerabilities and clean eligible reports. Direct logs inspected. Human milestone review deferred. Custom entity identities tracked separately in custom-entity-types.

---
id: typed-link-slice
type: Task
title: Introduce backward-compatible typed relationship editing
status: In progress
priority: High
accent: violet
tags: [current, knowledge, implementation]
relationships:
  - kind: implements
    target: typed-relationships
  - self-management
  - knowledge-engine
  - kind: depends-on
    target: lockfile
---
## Acceptance
A record may retain its original string links and add explicit typed edges. The editor offers compatible targets and shows direction; inverse labels are derived, not written as duplicate edges. Malformed edge shapes are rejected; missing or incompatible targets are visible in Audit. Existing metadata and revision checks remain intact.

Implementation: shared/records.ts, shared/relationships.ts, shared/audit.ts, src/RelationshipEditor.tsx and src/RecordLinks.tsx. Verification: tests/relationships.test.ts and manual testing in the Prism Development workspace. New tests are written, not yet verified.

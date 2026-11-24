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
implementationCommits: ["637e659212512fbb811bf3d91b05eb3aaaa393b2"]
---
## Acceptance
A record may retain its original string links and add explicit typed edges. The editor offers compatible targets and shows direction; inverse labels are derived, not written as duplicate edges. Malformed edge shapes are rejected; missing or incompatible targets are visible in Audit. Existing metadata and revision checks remain intact.

Implementation: shared/records.ts, shared/relationships.ts, shared/audit.ts, src/RelationshipEditor.tsx and src/RecordLinks.tsx. Verification: tests/relationships.test.ts and manual testing in the Prism Development workspace. New tests are written, not yet verified.

Implementation committed: 637e659212512fbb811bf3d91b05eb3aaaa393b2. Awaiting revision-specific local acceptance and CI verification. Do not infer passing tests from a commit.

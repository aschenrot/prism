---
id: typed-link-slice
type: Task
title: Introduce backward-compatible typed relationship editing
status: Ready
priority: High
accent: violet
tags: [knowledge, implementation]
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

Implementation: shared/records.ts, shared/relationships.ts, shared/audit.ts, src/RelationshipEditor.tsx and src/RecordLinks.tsx. Verification: tests/relationships.test.ts and manual testing in the Prism Development workspace. Tests passed in the accepted foundation verification.

Implementation committed: 637e659212512fbb811bf3d91b05eb3aaaa393b2. Accepted as part of foundation PR #1 by the owner; verified head 859efb773d22544fed85567e01f4623d35f788d0 (Windows Node 26.13.1, 27 tests passed, one expected file-symlink permission skip, typecheck/build passed, zero audit vulnerabilities), merged with history preserved at 156700abada6ec691e5fb0e7e4225cc2fffe9af0. This establishes acceptance of the foundation scope, not verification of subsequent editor changes.

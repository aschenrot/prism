---
id: m1-record-byte-integrity
type: Task
title: Bound record reads and preserve exact byte revisions
status: In progress
priority: High
accent: rose
tags: [current, integrity, quality]
relationships:
  - kind: implements
    target: data-integrity
  - storage
  - editing-reliability
  - m1-product-quality-corrections
  - m1-functional-verification
  - m1-milestone-acceptance
---
## Purpose
Audit confirmed the record store reads complete unbounded files and hashes UTF-8 decoded strings, not the original bytes. Invalid UTF-8 may be normalized to replacement characters. Protect original bytes, valid existing revisions and other records.

## Acceptance criteria
- Bound regular-file reads to 16 MB, matching the backup limit; reject malformed UTF-8 and ordinary mid-read changes without silently truncating or rewriting data. Hash the exact original bytes; valid prior UTF-8 revisions remain identical.
- Preserve readable records when an external record is invalid or oversized. Reject invalid Unicode or oversized output before publication.
- New record publication must be exclusive; update publication rechecks expected revision immediately before replacement and verifies the saved digest. Retain the documented limitation against non-cooperating processes racing the final filesystem operation.
- Isolated tests in store.test.ts, existing stale-save/recovery/trash tests, exact current CI evidence. No owner test burden or migration of valid records.

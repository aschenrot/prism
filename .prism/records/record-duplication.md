---
id: record-duplication
type: Task
title: Duplicate saved records and copy stable record links
status: Ready
priority: High
accent: teal
tags: [management, usability]
relationships:
  - record-management-increment
  - record-actions-acceptance
  - data-integrity
---
Extend the shared ellipsis menu with Duplicate and Copy record link. Duplicate checks the saved revision, blocks unresolved local recovery, creates a new ID and fresh timestamps, copies title/body/type/priority/accent and ordinary tags, sets Concept, excludes outgoing links, workflow tags (acceptance/current/blocker), unknown metadata and implementation evidence. It opens the existing recoverable editor; the source remains unchanged. A duplicate never inherits delivery scope, acceptance runs or historical completion. Copy uses the stable project/record address and only reports clipboard success after acknowledgement; fallback exposes a selectable address. Browser and unit tests written; verification pending.


## Integration outcome
Owner confirmed both automated gates and all manual acceptance checks passed for PR #11 and explicitly approved merging on 2026-11-24. Tested topic head: b625b1986a69159d8d0f6a0fc2c00d237899188c. Regular merge: c96c5c728acfbcc64953d8e1e94579bd44dfcc30. See [PR #11](https://github.com/aschenrot/prism/pull/11). Owner-reported acceptance; individual case observations and local run JSON were not supplied. This is historical evidence, not verification of the public-preview integration candidate.

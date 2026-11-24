---
id: record-properties
type: Task
title: Inline record properties and bounded bulk editing
status: Ready
priority: High
accent: teal
tags: [management, usability]
relationships:
  - kind: implements
    target: data-integrity
  - record-management-increment
  - record-actions-acceptance
  - management-views
---
Implement inline Status and Priority editing in Table and explicit visible-row multi-selection. Selection is limited to 100 records; filters, sorting, mode and route changes clear selection, and invisible records are excluded. Batch edit dialog applies only requested properties and shows independently confirmed results and unconfirmed/skipped rows. Each update uses a strict field whitelist and expected revision; existing local recovery drafts or unavailable recovery storage block the affected record. Other editable and unknown metadata, identity, creation timestamp and relationships are preserved. No atomic multi-file transaction or cross-profile draft lock is claimed. No auto retry. No-op saves preserve revision. Tests cover stale property writes, no-op updates, preserved unknown metadata, inline edit, bulk partial outcomes and selection reset. New verification pending.


## Integration outcome
Owner confirmed both automated gates and all manual acceptance checks passed for PR #11 and explicitly approved merging on 2026-11-24. Tested topic head: b625b1986a69159d8d0f6a0fc2c00d237899188c. Regular merge: c96c5c728acfbcc64953d8e1e94579bd44dfcc30. See [PR #11](https://github.com/aschenrot/prism/pull/11). Owner-reported acceptance; individual case observations and local run JSON were not supplied. This is historical evidence, not verification of the public-preview integration candidate.

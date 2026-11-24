---
id: record-properties
type: Task
title: Inline record properties and bounded bulk editing
status: In progress
priority: High
accent: teal
tags: [current, management, usability]
relationships:
  - kind: implements
    target: data-integrity
  - record-actions-acceptance
  - management-views
---
Implement inline Status and Priority editing in Table and explicit visible-row multi-selection. Selection is limited to 100 records; filters, sorting, mode and route changes clear selection, and invisible records are excluded. Batch edit dialog applies only requested properties and shows independently confirmed results and unconfirmed/skipped rows. Each update uses a strict field whitelist and expected revision; existing local recovery drafts or unavailable recovery storage block the affected record. Other editable and unknown metadata, identity, creation timestamp and relationships are preserved. No atomic multi-file transaction or cross-profile draft lock is claimed. No auto retry. No-op saves preserve revision. Tests cover stale property writes, no-op updates, preserved unknown metadata, inline edit, bulk partial outcomes and selection reset. New verification pending.

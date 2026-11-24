---
id: record-duplication
type: Task
title: Duplicate saved records and copy stable record links
status: In progress
priority: High
accent: teal
tags: [current, management, usability]
relationships:
  - record-management-increment
  - record-actions-acceptance
  - data-integrity
---
Extend the shared ellipsis menu with Duplicate and Copy record link. Duplicate checks the saved revision, blocks unresolved local recovery, creates a new ID and fresh timestamps, copies title/body/type/priority/accent and ordinary tags, sets Concept, excludes outgoing links, workflow tags (acceptance/current/blocker), unknown metadata and implementation evidence. It opens the existing recoverable editor; the source remains unchanged. A duplicate never inherits delivery scope, acceptance runs or historical completion. Copy uses the stable project/record address and only reports clipboard success after acknowledgement; fallback exposes a selectable address. Browser and unit tests written; verification pending.

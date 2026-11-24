---
id: inbox-capture
type: Task
title: Project inbox capture and triage
status: In progress
priority: High
accent: teal
tags: [inbox, knowledge, product]
relationships:
  - search-index
  - knowledge-engine
  - record-templates
---
Quick capture creates a canonical Idea in Concept with optional notes and an inbox flag, not a second record. Inbox lists active flagged records and opens the ordinary editor; finishing triage clears only the flag using the expected revision, preserving identity and content. Ordinary edits and trash/restore preserve the flag; duplication and template creation do not inherit it. Pending capture input is guarded during navigation, not recovered after reload. The dedicated API supports requeue; the initial interface supports capture and finish triage. Tests cover project isolation, conflicts, canonical persistence and return navigation. Owner K09 acceptance pending.

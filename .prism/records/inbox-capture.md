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


Technical integration: PR #22 merged at f6194915ce54d4eaf5bc10414f6241d85d545c87. Run 45459464209 passed all four hosted configurations at checkout be8b212b153b2d610a4e7e35f3b15e05e7da040a, identical tree cebfafc062df8aa24c3cf8380ac0b0848829ecb0 to head f03de993eababe3aa1d704a042e5a8266b4dccc1. 79 unit and 25 browser scenarios per job; no failed/flaky/skipped, clean eligible evidence, both audits zero vulnerabilities. Human K09 pending.

Follow-up: expose add-to-inbox and finish-triage from the shared record menu, preserve canonical revision and guard both menu and inbox-list mutations against existing recovery drafts. No changes to the data format. Human K09 includes returning existing records to the inbox.

Integration evidence: PR #32 merged at `a9f3adfc9984a2f7935ce00c7eb6888a2344665a`. [Verify 45483607451](https://github.com/aschenrot/prism/actions/runs/45483607451): all four configurations passed 96 unit and 33 browser scenarios each, zero failures/skips/flakes, clean exact checkout and zero audit vulnerabilities. Human acceptance remains pending.

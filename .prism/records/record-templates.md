---
id: record-templates
type: Task
title: Reusable project record templates
status: In progress
priority: High
accent: teal
tags: [templates, knowledge, product]
relationships:
  - search-index
  - knowledge-engine
---
Versioned per-project template definitions store initial title, semantic role, custom entity identity, priority, accent, ordinary tags, body and optional property defaults. UI create/edit/retire; revision-checked updates and instantiation, current schema/reference validation, independent new Concept record with new ID and timestamps. Never copy relationships, acceptance, delivery evidence or reserved workflow tags. Contextual creation lists compatible active templates. Retire without altering prior records; malformed files surfaced, conflicts retain edits until cancel and reopen. Defaults validated on application; template form reload recovery is a later reliability enhancement. No new dependencies. Owner K08 pending.


Technical integration: PR #21 merged at 0aaa7827c55a5392cf8116aa4967acf48c04ec8f; final run 45458675908 passed all four hosted configurations, 78 unit and 24 browser scenarios per job at checkout 0492ee84d259f6f474e02ef86addda081b9daeff, identical tree to head a306083cb467a053506dd4f5a5fdca13795e3e19. Clean eligible evidence, no failed/flaky/skipped tests and zero reported audit vulnerabilities. Human K08 acceptance pending.
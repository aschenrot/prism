---
id: requirements-traceability
type: Task
title: Explicit requirements and feature traceability
status: In progress
priority: High
accent: teal
tags: [product, management, quality]
relationships: [management-views, typed-relationships, knowledge-engine, m1-milestone-acceptance]
---
Add a reusable Traceability mode for Requirements, Features and Data library. Resolve explicit incoming implements, verifies and documents edges against all loaded records; deduplicate, reject invalid endpoints and show missing links without inferring completion. Current filters select rows, not linked evidence. Display authored status separately from test results, preserve return context and show incomplete data warnings. Add authored traceability counts to the existing live project report. Human K17 pending.


PR #30 integrated at a90cb758cfe3f4dcd2759f653325a2f06b471297. Run 45481688645: 95 unit + 31 browser scenarios per configuration, four configurations, zero failed/flaky/skipped, clean eligible evidence and zero reported audit vulnerabilities. Checkout 0004c0ddd8acc84a323216d94bc8f70b2a82a769, identical tree to proposed head. K17 human review pending.

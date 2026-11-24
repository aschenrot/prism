---
id: board-status-movement
type: Task
title: Accessible revision-safe board status movement
status: In progress
priority: High
accent: amber
tags: [management, interaction]
relationships:
  - kind: implements
    target: management-views
  - knowledge-engine
  - m1-milestone-acceptance
---
Use dedicated native drag handles and a keyboard/touch-operable Move to control on board cards. Cross-column movement uses the same expected-revision property command, recovery guard, confirmed result and refresh as table property edits. Do not optimistically relocate records, persist manual order, bypass filters or invent workflow states. Focus returns to the moved control when it remains visible, or the board if filters exclude it. External drops and same-column drops do not modify records. Browser coverage includes pointer movement, keyboard alternative, stale revision, protected draft and retained filters. Owner K10 pending.


Initial run 45463940111 passed npm gates and the 25 existing browser scenarios on inspected Ubuntu logs. New scenario timed out locating its drag handle: filter({has}) incorrectly included the ancestor column in a relative locator. Correct the relative locator, retaining actual drag and all subsequent assertions; rerun full matrix.


Technical integration: PR #23 merged at b64eec96a0de8443e2e89c12ebeb42706eb1aab8. Final run 45464611149 passed all four configurations, 79 unit and 26 browser scenarios each, zero failed/flaky/skipped, clean eligible evidence and zero reported audit vulnerabilities. Checkout dc1f39ecf5ee53c6d27ce67133755294696a2245, identical tree to 1fe4875cf5f0095eeeffb3f93db30d0c2e5ef3b7. Initial locator failure corrected without dropping assertions. Owner K10 pending.
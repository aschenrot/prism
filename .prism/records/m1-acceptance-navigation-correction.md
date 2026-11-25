---
id: m1-acceptance-navigation-correction
type: Task
title: Correct category search and secondary record navigation after failed M1 review
status: In progress
priority: High
accent: rose
tags: [current, blocker, usability, quality]
relationships:
  - kind: implements
    target: visual-quality
  - record-management-increment
  - m1-review-readiness
  - m1-milestone-acceptance
  - collection-interaction
  - record-navigation
---
Owner review R01 at 3eda97b reported an unwanted search bar when switching categories, unclear collection-to-record terminology and requested collapsed Relationships and Implementation evidence sections. H01–H04 passed on that historical revision; review finalized Changes requested with 20 remaining pending.

CI run [45502439452](https://github.com/aschenrot/prism/actions/runs/45502439452) reproduced the failure in all four jobs (37/38 browser cases passed, 1 failed). The downloaded Ubuntu/Node22 failure screenshot and accessibility snapshot show the old Work toolbar with its active query and New task button retained alongside the new Requirements toolbar and New requirement button. This establishes duplicate rendered controls, not an intended search field problem. Preserve the previously accepted left-aligned always-visible collection search rather than adding an opt-in interaction. Give the single collection toolbar and table settings stable host slots and derive local expansion from the current history-entry identity. Keep the Knowledge reader derived from current route focus and visible records rather than replacing its identity on destination changes. Add unique label IDs and assert exactly one live toolbar and input, correct contextual creation, no toolbar on dedicated pages, and active history filter restoration across category, record, view and project transitions. The causal lifecycle correction requires fresh CI confirmation; do not infer a React internals root cause. Native disclosures default closed and preserve linked record and evidence content. Rewrite R01 as concrete navigation steps. Add isolated browser coverage for category transitions, history, search focus, project Search isolation and disclosure keyboard operation. Reverify the full hosted matrix and exact main before another human review. No automatic acceptance or M2 work.


## Corrected candidate evidence
[Verify 45580578276](https://github.com/aschenrot/prism/actions/runs/45580578276) passed all four configurations: 100 unit/integration tests and 39 browser cases per configuration, no failures/skips/flakes, both audits zero vulnerabilities, clean eligible browser evidence. Exact synthetic checkout `5c2634471b70360a5d49fa72927986422cb69c6c`, tree `5206d05caddd33da76e6d298870be614038e681a`. The previously failing Work-to-Requirements case and full sidebar traversal passed. Follow-up commit guards transient expansion when browser history indices are reused, captures isolated passing screenshots, adds the PR association and clarifies owner-versus-developer review. A new complete exact-revision matrix is required for that commit.

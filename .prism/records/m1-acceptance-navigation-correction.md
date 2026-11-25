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

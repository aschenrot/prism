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

Source audit confirms empty collection search fields currently mount automatically on record collection destinations; no duplicate global search field was identified in source. Exact reported visual symptom not independently reproduced because local execution cannot reach the repository. Correct the identified behavior with an explicit left-aligned Search records control; active restored searches remain visible, clearing and closing is explicit, dedicated project Search remains distinct. Native disclosures default closed and preserve linked record and evidence content. Rewrite R01 as concrete navigation steps. Add isolated browser coverage for category transitions, history, search focus, project Search isolation and disclosure keyboard operation. Reverify the full hosted matrix and exact main before another human review. No automatic acceptance or M2 work.

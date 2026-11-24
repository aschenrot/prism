---
id: custom-entity-types
type: Task
title: Custom entity identities with built-in semantic roles
status: In progress
priority: High
accent: amber
tags: [current, knowledge, product]
relationships:
  - kind: implements
    target: custom-schemas
  - kind: depends-on
    target: property-schema-management
  - project-property-increment
  - m1-milestone-acceptance
---
Support project-defined stable custom entity type IDs, labels, immutable built-in role mappings and non-destructive retirement. Assign through the revision-aware record editor and preserve old draft/client compatibility; render identity, scope custom properties and filter collections by stable entity ID. Reject cross-role, missing and retired new assignments; retain existing retired records and inactive values. No destructive migration, implicit scope changes or duplication of property/evidence data. In-app type administration; role-based routes and relationship semantics unchanged. Tests cover schema transitions, store validation, recovery, legacy views and end-to-end admin/record/filter behavior. Technical verification and M1 human acceptance pending.


Technical integration: PR #18 merged at 0bde5bbe1d183e6e8a902a917ef1fcdf60b14fe6; run 45456348459 passed all four hosted configurations, 72 unit and 21 browser scenarios per job at checkout df2540420c14fff4902519d061416829e77b085f, identical tree to proposed head 99a4fe4d672af4c0a84e5d3b2b8da5c15721da53. No failed, flaky or skipped tests; clean start/end, eligible evidence, zero reported audit vulnerabilities. Initial run 45455789198 failed an ambiguous navigation locator; fixed by selecting the intended sidebar. Human K05 acceptance remains pending.
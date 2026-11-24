---
id: hosted-pr-association
type: Task
title: Associate pull requests and job evidence with delivery increments
status: In progress
priority: High
accent: amber
tags: [quality, management]
relationships:
  - kind: implements
    target: delivery-evidence
  - kind: depends-on
    target: hosted-workflow-metadata
  - hosted-delivery-increment
  - ci-import
  - m1-milestone-acceptance
---
Design and implement explicit repository/PR association scoped to an increment, not guessed from titles or branch names. Present provider PR state and head separately from actual matrix job and checked-out revision evidence; preserve historical observations and indicate unavailable/incomplete data. Respect read-only network boundary and revision-checked authored writes. No credentials or remote mutations in the initial public adapter. No inferred manual acceptance. Define exact schema, coverage and migration approach before implementation.

## Implementation slice
Optional `githubPullRequests` metadata (maximum five unique repository-qualified positive PR IDs), no migration required for absent field. Existing ordinary edit operations preserve the field; duplication excludes it. Explicit authored association, not editable in ordinary inspector yet. The reader displays links, configured-repository PR state, head/base and associated recent runs; mismatched references do not trigger lookups. Job details request exact selected attempt, validate identity and display reported head, statuses, counts and partial results. The UI does not promote provider success to matrix eligibility, actual checkout, integration readiness or acceptance. Network calls are fixed-origin, anonymous, explicit and bounded; no logs/artifacts or credentials read. Tests cover rejection, isolation, partial data, metadata preservation and explicit browser interaction. Current technical verification pending. Remaining: durable artifact/checkout evidence, historical lookup beyond recent page, general schema-driven reference authoring and milestone review.

## Technical integration
PR #15 merged at 34b8c2cc8c865ece6279ada09e8bd247ffbc1a36; required run 45391421549 passed all four jobs, 63 unit tests and 18 browser scenarios each, zero failed/flaky/skipped and both audits zero vulnerabilities. Checked-out synthetic revision 3a915503b73e1353aebbb9ec97f93941b808ff07 with identical tree. Post-merge main run 45391844584 passed all four jobs. Human milestone acceptance and live lookup remain pending; durable artifact verification and in-app authoring remain follow-up scope.


Follow-up: hosted-reference-authoring provides explicit in-app association editing through a dedicated revision-checked command with recoverable form input; no network lookup during authoring. Durable artifact/checkout verification remains distinct.

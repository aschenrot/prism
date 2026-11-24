---
id: hosted-delivery-increment
type: Increment
title: Hosted delivery intelligence
status: In progress
priority: High
accent: teal
tags: [current, quality, management]
githubPullRequests: [{repository: aschenrot/prism, number: 14}, {repository: aschenrot/prism, number: 15}, {repository: aschenrot/prism, number: 35}]
relationships:
  - ci-import
  - delivery-evidence
  - knowledge-engine
  - kind: contains
    target: hosted-workflow-metadata
  - kind: contains
    target: hosted-pr-association
  - kind: contains
    target: hosted-reference-authoring
  - kind: contains
    target: m1-milestone-acceptance
---
M1 increment: expose real GitHub evidence without duplicating authored planning or claiming completion. First slice: configured public workflow metadata in Quality, explicit refresh, source/run/revision provenance and safe failure states. Next slice: explicit PR association to delivery increments and matrix job evidence. No remote write access or automatic task completion. Integration requires the exact green hosted matrix and developer review. Shared consolidated M1 acceptance is intentionally deferred; only its hosted evidence cases relate to this increment. See development-workflow-decision for delegation and current integration blocker.

## Scoped hosted evidence
Explicit repository-qualified GitHub PR references are now canonical metadata, preserved by regular record mutations and excluded from duplication. Reference #14 is authored deliberately. Remote lookup resolves only the configured repository and reference; run association requires a matching provider base-repository ID and PR number, not branch/title guesses. Recent results can be incomplete. Job detail reads are attempt-specific and bounded to 50 jobs; no job metadata attests actual checkout, artifact coverage or human acceptance. PR/job view prepared; full current CI pending. Authored reference editing is through reviewed Markdown frontmatter initially; schema-driven authoring belongs to the next M1 engine increment.

## M1 closure scope
The earlier frontmatter-only authoring and pending-integration descriptions are historical. PRs #14–15 integrated under required hosted checks; see ci-verification and hosted-pr-association for exact evidence. PR #35 adds dedicated in-app association authoring; its integration and H04 review remain separate gates. Live provider access is an explicit H01–H03 review outcome, not established by mocked browser regressions. Durable artifact attestation remains outside this baseline.

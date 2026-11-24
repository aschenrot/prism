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
The earlier frontmatter-only authoring and pending-integration descriptions are historical. PRs #14–15 integrated under required hosted checks; see ci-verification and hosted-pr-association for exact evidence. PR #35 adds dedicated in-app association authoring; it is technically integrated; H04 human review remains pending. Live provider access is an explicit H01–H03 review outcome, not established by mocked browser regressions. Durable artifact attestation remains outside this baseline.


Integration evidence: PR #35 merged at `420a125a9e4e4a8e20b1bdc9770559e0f74440ea`. [Verify 45485957591](https://github.com/aschenrot/prism/actions/runs/45485957591): all four configurations passed 100 unit and 35 browser scenarios each, zero failures/skips/flakes, both audits zero vulnerabilities, clean eligible evidence at checkout `0d23b411567d4e32cb5e10990331f70b6c0c3665`, tree `47565952206db8a8385d3a2b1eea4843c86df653` matches merged main. H04 human review pending. Direct GitHub API response shapes sampled through the connector (not the application); live application lookup remains unverified.

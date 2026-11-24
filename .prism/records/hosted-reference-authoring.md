---
id: hosted-reference-authoring
type: Task
title: Explicit in-app pull request association authoring
status: In progress
priority: High
accent: teal
tags: [quality, management, evidence]
relationships:
  - kind: implements
    target: delivery-evidence
  - hosted-pr-association
  - hosted-delivery-increment
  - m1-milestone-acceptance
---
Use a dedicated expected-revision command to edit repository-qualified PR references on Increment records, separate from ordinary record mutations and remote lookup. Maximum five validated unique references; retain unrelated metadata and reject non-increment or stale writes. Recover incomplete association form input locally, block when a record recovery draft exists, and review stale references explicitly. No remote write, lookup or automatic acceptance on association. Human H04 pending.

Integration evidence: PR #35 merged at `420a125a9e4e4a8e20b1bdc9770559e0f74440ea`. [Verify 45485957591](https://github.com/aschenrot/prism/actions/runs/45485957591): all four configurations passed 100 unit and 35 browser scenarios each, zero failures/skips/flakes, both audits zero vulnerabilities, clean eligible evidence at checkout `0d23b411567d4e32cb5e10990331f70b6c0c3665`, tree `47565952206db8a8385d3a2b1eea4843c86df653` matches merged main. H04 human review pending. Direct GitHub API response shapes sampled through the connector (not the application); live application lookup remains unverified.

---
id: hosted-reference-authoring
type: Task
title: Explicit in-app pull request association authoring
status: In progress
priority: High
accent: teal
tags: [quality, management, evidence]
relationships: [hosted-pr-association, hosted-delivery-increment, m1-milestone-acceptance]
---
Use a dedicated expected-revision command to edit repository-qualified PR references on Increment records, separate from ordinary record mutations and remote lookup. Maximum five validated unique references; retain unrelated metadata and reject non-increment or stale writes. Recover incomplete association form input locally, block when a record recovery draft exists, and review stale references explicitly. No remote write, lookup or automatic acceptance on association. Human H04 pending.

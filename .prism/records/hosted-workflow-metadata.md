---
id: hosted-workflow-metadata
type: Task
title: Read public GitHub Actions metadata in Quality
status: In progress
priority: High
accent: amber
tags: [current, quality, implementation]
relationships:
  - kind: implements
    target: ci-import
  - hosted-delivery-increment
  - delivery-evidence
  - m1-milestone-acceptance
---
Acceptance criteria: a repository project explicitly configured with githubRepository can request its ten recent public workflow runs. Show repository, run ID/link, event, status/conclusion, attempt, observation/update times, head and associated PR links. Display unconfigured, unavailable, rate-limited, malformed and failed results without stale success. Never assume PR head equals checkout revision or change authored status. No request on navigation, no arbitrary URL or credentials, no redirect, bounded response/time and cache. Use deterministic mocked network tests and isolated browser fixture; no real external call in CI. Owner interaction review deferred to M1 milestone acceptance. Implementation prepared; automated verification pending. Actual live API lookup and scope/job evidence are separate follow-ups.

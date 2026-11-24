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

## Integration evidence (2026-11-24)
[PR #14](https://github.com/aschenrot/prism/pull/14) merged at 146b5da82dc8213ad2ab821b41d446dcd2135111. [Required run 45390802441](https://github.com/aschenrot/prism/actions/runs/45390802441) passed all four jobs at topic e2c98dc90f29c6f9ea3e898463f3cd1b440da4a1, synthetic checkout 38ca4ce09feaa57eb6de2560b7ddb16ad1cf430a, identical tree to merge. Direct logs: 59 unit tests and 17 browser scenarios per job, all passed; both audits zero vulnerabilities, no skips/flakes, eligible clean reports. Technical implementation integrated; live app lookup and M1 human acceptance remain pending. Provider API shape separately observed via GitHub connector, not a live application execution.

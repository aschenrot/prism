---
id: "dependency-policy"
type: "Decision"
title: "Latest compatible stable dependencies"
status: "Ready"
priority: "High"
accent: "violet"
tags: ["decision","dependencies"]
relationships: ["lockfile","security"]
---
Accepted engineering policy: AGENTS.md and docs/dependencies.md. Check official stable tags, security advisories, peer and Node compatibility, migration guides and licenses when adding/upgrading. Avoid forced upgrades, blanket script approvals and prereleases by default. Maintain reviewed lockfile and npm ci. Major upgrades should be evaluated individually.

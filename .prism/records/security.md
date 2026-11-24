---
id: "security"
type: "Risk"
title: "Dependency and local filesystem security"
status: "In progress"
priority: "High"
accent: "rose"
tags: ["risk","quality"]
relationships: ["dependency-policy","repository-browser","quality-gates"]
---
Historical user audit reported zero vulnerabilities after security upgrades; this is not a permanent assurance. Continue auditing exact resolved versions. Protect the loopback-only API, reject arbitrary project paths and symlinks, and never execute untrusted repository content by default. Remote deployment requires separate authentication and threat modeling.

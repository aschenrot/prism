---
id: "acceptance-baseline"
type: "Test"
title: "Local technical verification baseline"
status: "Ready"
priority: "High"
accent: "teal"
tags: ["quality","evidence"]
relationships: ["quality-gates","ci-verification"]
---
User-reported evidence from the dependency migration: Windows, Node 26.13.1; npm typecheck succeeded, 10 tests passed, one file-symlink test skipped due to Windows permissions, production build succeeded, full and production npm audit reported zero vulnerabilities. User subsequently reported the project-discovery and lazy-loading increment working.

This is historical evidence, not a guarantee for subsequent commits. The owner later committed the lockfile, inspected at bb3d0f0. That later lockfile is not proof of reproducing this historical test run. Latest CI at b0bcb3f reported failure; no successful newer run is established. Reference: docs/dependencies.md.

The owner has identified exhausted hosted Actions allowance; prior CI failures are historical and no longer a merge gate. New local results are required for the current branch.

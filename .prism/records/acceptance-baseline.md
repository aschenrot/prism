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

Owner-reported local run after c6a423f: locked install succeeded, 22 of 23 tests passed with one expected Windows symlink skip, both audits returned zero vulnerabilities. Typecheck and build failed on the same TS2339 diagnostic in LocalVerification.tsx. The local verifier produced evidence and rejected the gate. See local-verification for scope and required rerun.

Owner-reported successful local verification at exact revision 6064d82a9bae63c9e20c1a189f9a2458009ce793, Windows Node 26.13.1: clean locked install, typecheck, 22 passed tests / 1 expected Windows file-symlink permission skip, production build, both npm audits with zero vulnerabilities. Runner printed all automated gates passed. Vite main JS 399.28 kB (119.97 kB gzip); no size warning in output. esbuild install-script warning persists. Manual navigation feedback revealed a transition issue; fix tracked in navigation-stability. This is historical evidence for that exact revision, not a passing result for the subsequent fix.

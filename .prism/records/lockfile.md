---
id: "lockfile"
type: "Task"
title: "Commit verified package-lock.json"
status: "Concept"
priority: "High"
accent: "rose"
tags: ["current","blocker","dependencies"]
relationships: ["quality-gates","dependency-policy","ci-verification"]
---
The repository does not contain a package-lock.json at the inspected development head. Obtain the owner's locally verified lockfile, review it for credentials and matching manifest, commit it and switch CI to npm ci. Do not fabricate a dependency tree or overwrite the owner's local lockfile. Acceptance: clean install from the committed lock succeeds on Windows and Linux.

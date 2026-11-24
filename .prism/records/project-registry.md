---
id: "project-registry"
type: "System"
title: "Local project discovery"
status: "In progress"
priority: "High"
accent: "violet"
tags: ["architecture","current"]
relationships: ["self-workspace","project-settings"]
---
Implementation: server/projects.ts. Explicit registry or standalone override takes priority, followed by machine-local registry, tracked portable default registry, bundled game registry and standalone fallback. The previous automatic discovery was reported working; new self-workspace precedence requires retesting. Project roots are configured locally, never supplied arbitrarily by a browser.


Registration commands share discovery precedence with startup. Local settings are written to the ignored registry only, with exclusive creation and revision-aware replacement; browser IDs and safe metadata remain the API boundary. See local-project-registration.

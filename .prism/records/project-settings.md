---
id: "project-settings"
type: "Feature"
title: "Project registration and settings"
status: "In progress"
priority: "High"
accent: "amber"
tags: ["product","foundation"]
relationships: ["project-registry","knowledge-engine"]
---
Provide explicit local folder registration, project settings and an understandable project switcher. Keep machine paths out of shared records. Define a safe filesystem permission boundary before accepting browser-supplied paths. Acceptance: register, reopen and switch projects without environment variables while retaining explicit overrides.


Implementation slice: local-project-registration. Local shell grants existing folders; settings preserve stable IDs and roots. No arbitrary browser path endpoint; restart applies registry changes. Human K16 pending.

Technical implementation is integrated in the M1 candidate; consolidated owner acceptance remains pending. This status does not assert Ready or release acceptance.

---
id: "principles"
type: "Decision"
title: "Product and architecture principles"
status: "Ready"
priority: "High"
accent: "violet"
tags: ["product","decision","brief"]
relationships: ["architecture","dependency-policy"]
---
Accepted direction: local-first and repository-native; canonical Markdown/YAML records; Git for history; derived indexes may be rebuilt; no mandatory cloud or AI provider. Use open-source dependencies after license review. Owner selected AGPL-3.0-only for Prism's own source on 2026-11-24; third-party terms and notices remain intact. Public distribution awaits rights and privacy review.

A view stores queries and presentation configuration, never independent copies of facts. Code stays authoritative for implementation; authored decisions remain distinct from generated documentation. Avoid building an IDE, game engine or generic automation platform.

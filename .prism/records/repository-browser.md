---
id: "repository-browser"
type: "Feature"
title: "Read-only repository explorer"
status: "In progress"
priority: "Normal"
accent: "blue"
tags: ["product","engineering"]
relationships: ["architecture","git-intelligence","generated-docs"]
---
Implementation: server/repository.ts and src/Repository.tsx. Bounded file inventory and previews, Markdown rendering, rejection of path traversal and symbolic links. This increment adds server/ and shared/ browsing. It is not semantic code analysis. Nested example source may appear because examples are part of Prism's repository; their authored .prism data is excluded from browsing.

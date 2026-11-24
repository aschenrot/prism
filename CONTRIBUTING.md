# Contributing to Prism

Prism is an active development preview. Read [AGENTS.md](AGENTS.md), [the development workflow](docs/development-workflow.md), and the canonical roadmap and records before making changes.

- Use an existing scoped Increment or propose a coherent capability before opening a substantial PR. GitHub Issues may be used for external feedback; Prism owns its canonical backlog.
- Keep commits focused and link substantial changes with `Prism-Record: <id>` trailers. Do not commit personal project data, recovery drafts, verification caches, secrets or private assets.
- Use npm ci, npm run verify, and npm run test:browser (after installing the locked Chromium with npx --no-install playwright install chromium). Test against disposable data or isolated fixtures. Manual usability acceptance remains separate from automated checks.
- Describe scope, exact tested revision, results and limitations. Do not claim a check passed unless it ran successfully.

## License of contributions

Contribute only material you have the right to submit under AGPL-3.0-only. By submitting a contribution intended for inclusion in Prism, you agree that your contribution is made available under the same AGPL-3.0-only license, unless the maintainers explicitly accept a separately identified compatible third-party component under its own terms. Retain applicable third-party notices. No copyright assignment is requested by this policy. Do not submit confidential material or credentials.

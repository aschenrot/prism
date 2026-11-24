# Dependency maintenance

Policy: prefer the latest compatible stable version, check official registry tags and migrations at the time of every update, pin reproducible resolutions with a committed lockfile, and review security advisories and licenses. Do not blindly upgrade unrelated majors or use npm audit fix --force.

## Security and tooling migration — 2026-11-24

The supplied npm audit identifies high-severity @fastify/static and zod findings, plus glob/minimatch inherited through @fastify/static. Target stable versions confirmed on npm:
- @fastify/static 10.1.12 (compatible with Fastify 5); fastify 5.12.8.
- zod 4.6.7 (audit fix); metadata uses looseObject and editable input uses strictObject.
- vite 8.3.8 and @vitejs/plugin-react 6.3.0; migrate the simple Vite configuration together. Vite 8 uses Rolldown rather than the old esbuild/Rollup pipeline.
- tsx 4.23.15; retains its own esbuild dependency. Do not override nested esbuild versions to force deduplication.

Other dependency lines remain unchanged in this focused migration pending their own compatibility reviews. Run npm outdated to identify any remaining stable upgrades; the latest tag is not a guarantee of compatibility.

The registry is unavailable from the editing environment; install, audit, lockfile generation and full runtime verification are outstanding. No zero-vulnerability claim until a fresh audit confirms it.

## Local verification
1. npm install
2. npm outdated
3. npm audit
4. npm audit --omit=dev
5. npm run typecheck
6. npm test
7. npm run build
8. npm run dev; also test npm start after stopping dev.

Review pending install scripts with npm install-scripts ls on npm versions that provide that command. Review the exact version and upstream script before approval; never approve all automatically. Run npm ls esbuild to inspect the remaining paths. Commit the reviewed package-lock.json after successful resolution, then use npm ci for reproducible installation.

Official references:
- https://www.npmjs.com/package/@fastify/static
- https://www.npmjs.com/package/zod
- https://zod.dev/v4/changelog
- https://vite.dev/guide/migration
- https://docs.npmjs.com/cli/commands/npm-install-scripts/

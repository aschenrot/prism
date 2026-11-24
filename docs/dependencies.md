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

## Windows verification — user-reported 2026-11-24
Node 26.13.1: typecheck and production build succeeded; 10 tests passed, one file-symlink test skipped because Windows denied permission; both full and production npm audits reported zero vulnerabilities. Vite and tsx resolve to one esbuild 0.28.2. One install-script approval warning remains. No lockfile received yet.

Reported newer major versions: concurrently 10.0.7, lucide-react 1.78.0, motion 14.14.0, TypeScript 7.0.2 and Node types 26.6.6. These are not security blockers in the supplied audit. Node types remain on the lowest supported Node major unless support policy changes. Review major migration guides, icon exports, motion APIs, compiler/Node engine and runner compatibility in separate changes; no blanket upgrades.

The reported initial JS chunk was 660.96 kB minified (201.60 kB gzip). Presentation, knowledge and repository views now load on demand; measure the next production build rather than raising the warning threshold. No new dependencies added by this optimization.

## Lockfile baseline
At bb3d0f0, the owner-provided npm lockfile was present and matched the manifest's root declarations. All resolved URLs inspected were from the public npm registry, with no embedded credentials. CI now uses npm ci unconditionally. Clean Windows/Linux verification remains outstanding; earlier CI run 45325390198 failed with inaccessible logs. See the lockfile and CI task records.

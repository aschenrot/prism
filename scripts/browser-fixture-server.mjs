// This entry point must never open the normal development registry.
import { readFileSync,lstatSync } from 'node:fs';
import { basename,join } from 'node:path';
const root=process.env.PRISM_BROWSER_FIXTURE_ROOT,token=process.env.PRISM_BROWSER_TEST_TOKEN;
if(!root||!token||!basename(root).startsWith('prism-browser-')||!lstatSync(root).isDirectory())throw Error('Browser test fixture required');
const registry=join(root,'registry.json');
const projects=JSON.parse(readFileSync(registry,'utf8'));
if(projects.length!==2||projects[0].id!=='browser-review'||projects[0].title!=='Browser fixture '+token||projects[0].root!==join(root,'repo')||projects[1].id!=='browser-other'||projects[1].root!==join(root,'other'))throw Error('Invalid isolated browser fixture registry');
process.env.PRISM_PROJECTS=registry;
delete process.env.PRISM_PROJECT;
await import('../server/index.ts');

import { spawnSync } from 'node:child_process';
import { mkdtempSync,mkdirSync,readFileSync,writeFileSync,lstatSync,realpathSync,renameSync,rmSync } from 'node:fs';
import { dirname,join,relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';
const minimumScenarios=22;
const root=realpathSync(join(dirname(fileURLToPath(import.meta.url)),'..'));
const npm=process.env.npm_execpath;
if(!npm)throw Error('Use npm run test:browser.');
const manifest=JSON.parse(readFileSync(join(root,'package.json'),'utf8'));
const lock=JSON.parse(readFileSync(join(root,'package-lock.json'),'utf8'));
let browserPackage;
try{browserPackage=JSON.parse(readFileSync(join(root,'node_modules','@playwright','test','package.json'),'utf8'));}catch{/* installation pending */}
if(!browserPackage||manifest.devDependencies?.['@playwright/test']!==browserPackage.version||lock.packages?.['node_modules/@playwright/test']?.version!==browserPackage.version){
  console.error('Browser tooling must be installed and locked at an exact version. Run npm install --save-dev --save-exact @playwright/test, then npx playwright install chromium. Review and commit the two dependency files before claiming clean-revision evidence.');
  process.exit(1);
}
const env=Object.fromEntries(Object.entries(process.env).filter(([key])=>!key.toUpperCase().startsWith('GIT_')));
Object.assign(env,{GIT_OPTIONAL_LOCKS:'0',GIT_TERMINAL_PROMPT:'0',GIT_NO_LAZY_FETCH:'1',GIT_ALLOW_PROTOCOL:''});
function git(cwd,args,extraEnv={}){
  const r=spawnSync('git',['--no-pager','--no-replace-objects','-C',cwd,'-c','core.fsmonitor=false',...args],{env:{...env,...extraEnv},encoding:'utf8',timeout:10000,maxBuffer:2*1024*1024,windowsHide:true});
  if(r.error||r.status!==0)throw Error('Git inspection or isolated fixture initialization failed: '+(r.stderr||r.error?.message||'unknown error'));
  return r.stdout.trimEnd();
}
function snapshot(){
  const head=git(root,['rev-parse','--verify','HEAD']).trim();
  if(!/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/.test(head))throw Error('Invalid Git revision');
  return {head,clean:git(root,['status','--porcelain=v1','--untracked-files=normal','--ignore-submodules=none'])===''};
}
function dir(path){
  try{mkdirSync(path);}catch(e){if(e.code!=='EEXIST')throw e;}
  if(!lstatSync(path).isDirectory())throw Error('Evidence directory must be a real directory');
  return path;
}
let fixture;
try{
  if(relative(root,realpathSync(git(root,['rev-parse','--show-toplevel']).trim()))!=='')throw Error('Run from the independent Prism repository');
  const start=snapshot(),startedAt=new Date().toISOString(),id=randomUUID();
  if(!start.clean)console.warn('Dirty working tree: browser results will be diagnostic only.');
  const cache=dir(join(dir(join(root,'.prism')),'cache')),browserDir=dir(join(cache,'browser')),output=dir(join(browserDir,id));
  fixture=mkdtempSync(join(tmpdir(),'prism-browser-'));
  const repo=dir(join(fixture,'repo')),other=dir(join(fixture,'other')),data=dir(join(repo,'.prism'));
  dir(join(data,'records'));dir(join(other,'records'));
  const hooks=dir(join(fixture,'empty-hooks'));
  const isolatedGit={GIT_CONFIG_NOSYSTEM:'1',GIT_CONFIG_GLOBAL:process.platform==='win32'?'NUL':'/dev/null',GIT_OPTIONAL_LOCKS:'1'};
  git(repo,['init','--quiet','--initial-branch=main','--template='],isolatedGit);
  writeFileSync(join(repo,'.gitignore'),'*.local\n.prism/cache/\n');
  git(repo,['add','.gitignore'],isolatedGit);
  git(repo,['-c','user.name=Prism test fixture','-c','user.email=fixture@example.invalid','-c','commit.gpgsign=false','-c','core.hooksPath='+hooks,'commit','--quiet','-m','Isolated browser test fixture'],isolatedGit);
  writeFileSync(join(fixture,'registry.json'),JSON.stringify([
    {id:'browser-review',title:'Browser fixture '+id,root:repo,storage:'repository',profiles:['core','product','project']},
    {id:'browser-other',title:'Browser other fixture',root:other,storage:'standalone',profiles:['core','product','project']}
  ]));
  const build=spawnSync(process.execPath,[npm,'run','build'],{cwd:root,stdio:'inherit',windowsHide:true});
  let result=null;
  if(!build.error&&build.status===0){
    result=spawnSync(process.execPath,[join(root,'node_modules','@playwright','test','cli.js'),'test','--config','playwright.config.mjs'],{
      cwd:root,stdio:'inherit',windowsHide:true,env:{...env,PRISM_BROWSER_FIXTURE_ROOT:fixture,PRISM_BROWSER_TEST_TOKEN:id,PRISM_BROWSER_OUTPUT:output}
    });
  }else console.error('Build failed; browser tests were not run.');
  let stats=null;
  try{
    const report=JSON.parse(readFileSync(join(output,'results.json'),'utf8'));
    const counts=report.stats;
    if(['expected','unexpected','flaky','skipped'].every(k=>Number.isSafeInteger(counts?.[k])&&counts[k]>=0))stats={passed:counts.expected,failed:counts.unexpected,flaky:counts.flaky,skipped:counts.skipped};
  }catch{/* No trustworthy report; gate fails. */}
  let end=null;try{end=snapshot();}catch{/* no clean evidence */}
  const eligible=!!(start.clean&&end?.clean&&start.head===end.head&&result?.status===0&&!result.error&&stats&&stats.passed>=minimumScenarios&&!stats.failed&&!stats.flaky&&!stats.skipped);
  const evidence={version:1,source:'local-playwright',revision:start.head,endingRevision:end?.head??null,cleanAtStart:start.clean,cleanAtEnd:end?.clean??false,startedAt,finishedAt:new Date().toISOString(),environment:{platform:process.platform,arch:process.arch,node:process.version,playwright:browserPackage.version,browser:'chromium'},buildExitCode:build.status,browserExitCode:result?.status??null,stats,minimumScenarios,eligible,reportDirectory:id};
  const temp=join(browserDir,'.'+randomUUID()+'.tmp');
  try{writeFileSync(temp,JSON.stringify(evidence,null,2)+'\n',{flag:'wx',flush:true});renameSync(temp,join(browserDir,'latest.json'));}finally{rmSync(temp,{force:true});}
  console.log('\nBrowser evidence: .prism/cache/browser/latest.json');
  console.log(JSON.stringify(evidence,null,2));
  console.log(eligible?'Browser regression gate passed for clean revision '+start.head:'Browser regression gate not eligible (build, test, report, cleanliness or revision failure).');
  process.exitCode=eligible?0:1;
}catch(e){console.error(e instanceof Error?e.message:'Browser verification failed');process.exitCode=1;}
finally{if(fixture)rmSync(fixture,{recursive:true,force:true,maxRetries:3,retryDelay:100});}

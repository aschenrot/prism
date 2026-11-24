import { spawnSync } from 'node:child_process';
import { mkdirSync, lstatSync, realpathSync, writeFileSync, renameSync, rmSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';

const root=realpathSync(join(dirname(fileURLToPath(import.meta.url)),'..'));
const npm=process.env.npm_execpath;
if(!npm){console.error('Run npm run verify from the Prism repository.');process.exit(1);}
const env=Object.fromEntries(Object.entries(process.env).filter(([key])=>!key.toUpperCase().startsWith('GIT_')));
Object.assign(env,{GIT_OPTIONAL_LOCKS:'0',GIT_TERMINAL_PROMPT:'0',GIT_NO_LAZY_FETCH:'1',GIT_ALLOW_PROTOCOL:''});
function git(args){
  const r=spawnSync('git',['--no-pager','--no-replace-objects','-C',root,'-c','core.fsmonitor=false',...args],{env,encoding:'utf8',timeout:10000,maxBuffer:2*1024*1024,windowsHide:true});
  if(r.error||r.status!==0)throw new Error('Could not inspect local Git repository.');
  return r.stdout;
}
function snapshot(){
  const head=git(['rev-parse','--verify','HEAD']).trim();
  if(!/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/.test(head))throw new Error('Invalid Git HEAD.');
  return {head,clean:git(['status','--porcelain=v1','--untracked-files=normal','--ignore-submodules=none']).length===0};
}
function realDirectory(path){
  mkdirSync(path,{recursive:false});
}
function ensureDirectory(path){
  try{realDirectory(path);}catch(e){if(e.code!=='EEXIST')throw e;}
  if(!lstatSync(path).isDirectory())throw new Error('Verification output directory must not be a symbolic link.');
}
try{
  if(relative(root,realpathSync(git(['rev-parse','--show-toplevel']).trim()))!=='')throw new Error('Run the verifier from the independent Prism repository.');
  const start=snapshot();
  if(!start.clean)console.warn('Working tree is dirty. Results are diagnostic only, not a clean-revision merge gate.');
  const startedAt=new Date().toISOString();
  const npmVersion=spawnSync(process.execPath,[npm,'--version'],{cwd:root,encoding:'utf8',timeout:10000,windowsHide:true});
  const definitions=[
    ['install',['ci','--no-audit','--no-fund']],
    ['typecheck',['run','typecheck']],
    ['test',['test']],
    ['build',['run','build']],
    ['audit',['audit','--audit-level=high']],
    ['audit-production',['audit','--omit=dev','--audit-level=high']]
  ];
  const steps=[];
  let installFailed=false;
  for(const [id,args] of definitions){
    if(installFailed&&['typecheck','test','build'].includes(id)){steps.push({id,status:'skipped',exitCode:null,durationMs:0});continue;}
    console.log('\n=== '+id+' ===');
    const t=Date.now();
    const result=spawnSync(process.execPath,[npm,...args],{cwd:root,stdio:'inherit',windowsHide:true});
    const passed=!result.error&&result.status===0;
    steps.push({id,status:passed?'passed':'failed',exitCode:result.status,durationMs:Math.max(0,Date.now()-t)});
    if(id==='install'&&!passed)installFailed=true;
    if(result.error)console.error('Could not launch or complete '+id+'.');
  }
  let end;
  try{end=snapshot();}catch{end=null;}
  const report={version:1,source:'local-npm',startedAt,finishedAt:new Date().toISOString(),revision:start.head,endingRevision:end?.head??null,cleanAtStart:start.clean,cleanAtEnd:end?.clean??false,environment:{platform:process.platform,arch:process.arch,node:process.version,npm:npmVersion.status===0?npmVersion.stdout.trim():'unknown'},steps};
  const data=join(root,'.prism'),cache=join(data,'cache'),dir=join(cache,'verification');
  for(const p of [data,cache,dir])ensureDirectory(p);
  const tmp=join(dir,'.'+randomUUID()+'.tmp');
  try{writeFileSync(tmp,JSON.stringify(report,null,2)+'\n',{flag:'wx',flush:true});renameSync(tmp,join(dir,'latest.json'));}finally{rmSync(tmp,{force:true});}
  const eligible=start.clean&&end?.clean&&start.head===end.head&&steps.every(s=>s.status==='passed');
  console.log('\nLocal verification evidence: .prism/cache/verification/latest.json');
  console.log(eligible?'All automated gates passed for clean revision '+start.head:'Verification not eligible for merge: failed/skipped checks, dirty tree, or changed/unavailable revision.');
  console.log('Manual runtime, interaction and review acceptance remain separate.');
  process.exitCode=eligible?0:1;
}catch(e){console.error(e instanceof Error?e.message:'Local verification failed.');process.exitCode=1;}

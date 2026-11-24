import { execFile } from 'node:child_process';
import { lstat,realpath } from 'node:fs/promises';
import { join,relative } from 'node:path';
import { promisify } from 'node:util';
import type { CommitEvidence,GitHistory } from '../shared/delivery';
const run=promisify(execFile);
const LIMIT=100;
const SHA=/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/;
const ID=/^[a-z0-9][a-z0-9-]{0,95}$/;
async function git(root:string,args:string[]){
  // No inherited Git directory/config overrides; no shell, network or optional locks.
  const env=Object.fromEntries(Object.entries(process.env).filter(([key])=>!key.toUpperCase().startsWith('GIT_')));
  Object.assign(env,{GIT_OPTIONAL_LOCKS:'0',GIT_TERMINAL_PROMPT:'0',GIT_NO_LAZY_FETCH:'1',GIT_ALLOW_PROTOCOL:'',GIT_CONFIG_NOSYSTEM:'1',GIT_CONFIG_GLOBAL:process.platform==='win32'?'NUL':'/dev/null'});
  const result=await run('git',['--no-pager','--no-replace-objects','-C',root,...args],{env,encoding:'utf8',timeout:5000,maxBuffer:2*1024*1024,windowsHide:true});
  return result.stdout;
}
export function parseHistory(raw:string):CommitEvidence[]{
  if(!raw)return [];
  const parts=raw.split('\0');
  if(parts.pop()!==''||parts.length%4!==0)throw new Error('Unexpected Git history format');
  const commits:CommitEvidence[]=[];
  for(let i=0;i<parts.length;i+=4){
    const [sha,date,subject,trailers]=parts.slice(i,i+4);
    if(!SHA.test(sha)||!Number.isFinite(Date.parse(date)))throw new Error('Invalid Git history entry');
    const values=trailers?trailers.split('\x1f').map(x=>x.trim()):[];
    commits.push({sha,date,subject,recordIds:[...new Set(values.filter(x=>ID.test(x)))],invalidReferences:[...new Set(values.filter(x=>!ID.test(x)))]});
  }
  return commits;
}
export async function readGitHistory(root:string):Promise<GitHistory>{
  const observedAt=new Date().toISOString();
  const unavailable=(message:string):GitHistory=>({state:'unavailable',message,observedAt});
  try{
    // A nested example must not inherit the enclosing application's Git history.
    try{const marker=await lstat(join(root,'.git'));if(!marker.isDirectory()&&!marker.isFile())return unavailable('No supported Git metadata at this project root.');}
    catch(e){if((e as NodeJS.ErrnoException).code==='ENOENT')return unavailable('This project has no independent Git repository.');throw e;}
    const top=await realpath((await git(root,['rev-parse','--show-toplevel'])).trim());
    if(relative(await realpath(root),top)!=='')return unavailable('The configured project is not the Git repository root.');
    const head=(await git(root,['rev-parse','--verify','HEAD'])).trim();
    if(!SHA.test(head))throw new Error('Invalid HEAD');
    const shallow=(await git(root,['rev-parse','--is-shallow-repository'])).trim()==='true';
    // Read the captured HEAD, not a moving branch. No diffs, signatures, notes or external drivers.
    const raw=await git(root,['log','--no-show-signature','--no-notes','--no-decorate','--max-count='+String(LIMIT+1),'-z','--format=%H%x00%cI%x00%s%x00%(trailers:key=Prism-Record,valueonly,separator=%x1f)',head,'--']);
    const commits=parseHistory(raw);
    return {state:'available',head,commits:commits.slice(0,LIMIT),truncated:commits.length>LIMIT,shallow,observedAt};
  }catch(e){
    const code=(e as NodeJS.ErrnoException).code;
    return {state:'error',message:code==='ENOENT'?'Git executable unavailable. Install Git or check PATH.':'Could not read local Git history. Check repository access, HEAD, Git compatibility and permissions.',observedAt};
  }
}
// Coalesce overlapping reads from polling and multiple local views.
const pending=new Map<string,Promise<GitHistory>>();
export function gitHistory(root:string):Promise<GitHistory>{
  const existing=pending.get(root);if(existing)return existing;
  const task=readGitHistory(root).finally(()=>pending.delete(root));
  pending.set(root,task);return task;
}

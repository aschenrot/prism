import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp,mkdir,rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseHistory,readGitHistory } from '../server/git';
import { linkedCommits,reconcileHistory,type GitHistory } from '../shared/delivery';
import { recordSchema,type ProjectRecord } from '../shared/records';
const sha='a'.repeat(40),sha2='b'.repeat(40),date='2026-11-24T00:00:00Z';
function record(id:string,implementationCommits:string[]=[]):ProjectRecord{return {...recordSchema.parse({id,title:id,type:'Task',status:'In progress',priority:'High',accent:'teal',tags:[],relationships:[],body:'Description',implementationCommits}),revision:'c'.repeat(64)};}
test('parse bounded Git format and explicit record trailers',()=>{
  const raw=[sha,date,'Subject','task-a\x1ftask-a\x1f../bad',sha2,date,'Another',''].join('\0')+'\0';
  const commits=parseHistory(raw);
  assert.deepEqual(commits[0].recordIds,['task-a']);assert.deepEqual(commits[0].invalidReferences,['../bad']);
  assert.equal(commits[1].recordIds.length,0);
  assert.throws(()=>parseHistory(raw.slice(0,-1)));
  const history:GitHistory={state:'available',head:sha,commits,truncated:false,shallow:false,observedAt:date};
  const a=record('task-a'),b=record('task-b',[sha2]);
  assert.deepEqual(linkedCommits(a,history).map(c=>c.sha),[sha]);
  assert.deepEqual(linkedCommits(b,history).map(c=>c.sha),[sha2]);
  const summary=reconcileHistory([a,b],history);
  assert.equal(summary.pending.length,2);assert.equal(summary.unlinked.length,0);assert.equal(summary.invalid.length,1);
  assert.equal(a.status,'In progress');
  assert.equal(reconcileHistory([],history).unresolved[0].id,'task-a');
});
test('local Git history is root-scoped and reads only explicit trailers',async t=>{
  try{execFileSync('git',['--version'],{stdio:'ignore'});}catch(e){if((e as NodeJS.ErrnoException).code==='ENOENT'){t.skip('Git executable is unavailable');return;}throw e;}
  const root=await mkdtemp(join(tmpdir(),'prism-git-'));
  try{
    const git=(...args:string[])=>execFileSync('git',['-C',root,...args],{stdio:'ignore'});
    git('init','-q');
    git('-c','user.name=Prism Test','-c','user.email=test@example.invalid','-c','commit.gpgsign=false','-c','core.hooksPath='+join(root,'no-hooks'),'commit','--allow-empty','-qm','Unlinked subject mentions task-a');
    git('-c','user.name=Prism Test','-c','user.email=test@example.invalid','-c','commit.gpgsign=false','-c','core.hooksPath='+join(root,'no-hooks'),'commit','--allow-empty','-qm','Linked change','-m','Prism-Record: task-a');
    const history=await readGitHistory(root);
    if(history.state!=='available')throw Error(history.message);
    assert.equal(history.commits.length,2);assert.deepEqual(history.commits[0].recordIds,['task-a']);assert.deepEqual(history.commits[1].recordIds,[]);
    const nested=join(root,'example');await mkdir(nested);assert.equal((await readGitHistory(nested)).state,'unavailable');
  }finally{await rm(root,{recursive:true,force:true});}
});

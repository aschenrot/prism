import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp,mkdir,writeFile,rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { verificationSchema,verificationSteps,verificationState } from '../shared/verification';
import { readVerification } from '../server/verification';
const head='a'.repeat(40),date='2026-11-24T00:00:00Z';
const report=verificationSchema.parse({version:1,source:'local-npm',startedAt:date,finishedAt:date,revision:head,endingRevision:head,cleanAtStart:true,cleanAtEnd:true,environment:{platform:'win32',arch:'x64',node:'v26.13.1',npm:'test'},steps:verificationSteps.map(id=>({id,status:'passed',exitCode:0,durationMs:1}))});
test('verification compares exact revision, cleanliness and actual check outcomes',()=>{
  assert.equal(verificationState(report,head),'passed');
  assert.equal(verificationState(report,'b'.repeat(40)),'historical');
  assert.equal(verificationState(report,undefined),'unknown');
  assert.equal(verificationState({...report,cleanAtEnd:false},head),'diagnostic');
  assert.equal(verificationState({...report,endingRevision:null},head),'diagnostic');
  const failed=verificationSchema.parse({...report,steps:report.steps.map(s=>s.id==='test'?{...s,status:'failed',exitCode:1}:s)});
  assert.equal(verificationState(failed,head),'not-passed');
  assert.equal(verificationSchema.safeParse({...report,steps:report.steps.map(()=>report.steps[0])}).success,false);
  assert.equal(verificationSchema.safeParse({...report,steps:report.steps.map(s=>s.id==='test'?{...s,exitCode:1}:s)}).success,false);
});
test('verification reader accepts only bounded validated local reports',async()=>{
  const root=await mkdtemp(join(tmpdir(),'prism-verification-'));
  try{
    assert.equal((await readVerification(root)).state,'unavailable');
    const dir=join(root,'.prism','cache','verification');await mkdir(dir,{recursive:true});
    const path=join(dir,'latest.json');await writeFile(path,JSON.stringify(report));
    assert.deepEqual(await readVerification(root),{state:'available',report});
    await writeFile(path,'{}');assert.equal((await readVerification(root)).state,'error');
    await writeFile(path,' '.repeat(65537));assert.equal((await readVerification(root)).state,'error');
  }finally{await rm(root,{recursive:true,force:true});}
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp,rm,mkdir,writeFile,readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { acceptanceDefinition,acceptanceProgress,acceptanceRunSchema,currentAcceptance,applyAcceptanceUpdate,type AcceptanceRunData } from '../shared/acceptance';
import { recordSchema,type ProjectRecord } from '../shared/records';
import { AcceptanceStore } from '../server/acceptance';
import { reviewSummary } from '../shared/reviewSummary';
import { ConflictError } from '../server/store';
const head='a'.repeat(40),definitionRevision='b'.repeat(64),date='2026-11-24T00:00:00Z';
const body='## Review instructions\nUse a disposable record.\n\n## A. Recovery\nGroup setup.\n- [x] A01 — **Close and recover** — Edit and reopen. Expected: Exact draft restored.\n- [ ] A02 — **Save the draft** — Save changes. Expected: Saved values appear.\n\n## Results\nHistorical notes are not outcomes.\n';
const record:ProjectRecord={...recordSchema.parse({id:'review',title:'Review',type:'Test',status:'In progress',priority:'High',accent:'teal',tags:['acceptance'],relationships:[],body}),revision:definitionRevision};
function definition(){
  const parsed=acceptanceDefinition(record);if(parsed.state!=='available')throw Error('Invalid fixture');return parsed.definition;
}
const data:AcceptanceRunData={version:1,id:'run-one',testId:record.id,testTitle:record.title,definitionRevision,testedRevision:head,definition:definition(),reviewer:'Test reviewer',environment:'Fixture environment',startedAt:date,updatedAt:date,results:[],decision:'open',decisionNotes:'',verification:null};
const expected='c'.repeat(64);
test('acceptance definition preserves authored groups, instructions and stable cases; checkmarks are not results',()=>{
  const d=definition();assert.equal(d.groups.length,1);assert.equal(d.groups[0].setup,'Group setup.');
  assert.equal(d.groups[0].cases[0].title,'Close and recover');assert.equal(d.groups[0].cases[0].expected,'Exact draft restored.');
  assert.equal(d.instructions,'Use a disposable record.');assert.deepEqual(acceptanceProgress(data),{total:2,passed:0,failed:0,blocked:0,pending:2});
  assert.equal(acceptanceDefinition({...record,tags:[]}).state,'unsupported');
  assert.equal(acceptanceDefinition({...record,body:body.replace('A02','A01')}).state,'invalid');
  assert.equal(acceptanceDefinition({...record,body:body.replace('Expected: Saved values appear.','Missing expected')}).state,'invalid');
});
test('manual outcomes and final decisions enforce case identity, notes and complete coverage',()=>{
  assert.throws(()=>applyAcceptanceUpdate(data,{action:'case',expectedRevision:expected,caseId:'A01',outcome:'Failed',notes:''},date));
  assert.throws(()=>applyAcceptanceUpdate(data,{action:'case',expectedRevision:expected,caseId:'Z01',outcome:'Passed',notes:''},date));
  assert.throws(()=>applyAcceptanceUpdate(data,{action:'decision',expectedRevision:expected,decision:'accepted',notes:'Approved'},date));
  const one=applyAcceptanceUpdate(data,{action:'case',expectedRevision:expected,caseId:'A01',outcome:'Passed',notes:'Observed'},date);
  const two=applyAcceptanceUpdate(one,{action:'case',expectedRevision:expected,caseId:'A02',outcome:'Passed',notes:''},date);
  assert.equal(acceptanceProgress(two).passed,2);
  const finalized=applyAcceptanceUpdate(two,{action:'decision',expectedRevision:expected,decision:'accepted',notes:'All cases observed'},date);
  assert.equal(finalized.decision,'accepted');
  assert.throws(()=>applyAcceptanceUpdate(finalized,{action:'case',expectedRevision:expected,caseId:'A01',outcome:'Pending',notes:''},date));
  assert.equal(acceptanceRunSchema.safeParse({...two,results:[two.results[0],two.results[0]]}).success,false);
  assert.equal(currentAcceptance(two,head,definitionRevision),true);
  assert.equal(currentAcceptance(two,head,'d'.repeat(64)),false);
  assert.equal(currentAcceptance(two,undefined,definitionRevision),false);
});
test('local acceptance runs survive reopening, preserve history and reject stale mutations',async()=>{
  const root=await mkdtemp(join(tmpdir(),'prism-acceptance-'));
  try{
    let currentHead=head,currentRecord=record;
    const scope=async()=>({record:currentRecord,head:currentHead,verification:null});
    const store=new AcceptanceStore(root,scope);
    assert.deepEqual(await store.list(record.id),{runs:[],errors:[]});
    const start={expectedDefinitionRevision:definitionRevision,expectedHead:head,reviewer:'Reviewer',environment:'Fixture'};
    const run=await store.create(record.id,start);
    assert.equal(run.testedRevision,head);assert.equal(run.definitionRevision,definitionRevision);assert.equal(run.results.length,0);
    const saved=await store.update(record.id,run.id,{action:'case',expectedRevision:run.revision,caseId:'A01',outcome:'Passed',notes:'Observed'});
    assert.notEqual(saved.revision,run.revision);
    const reopened=new AcceptanceStore(root,scope);
    assert.deepEqual(await reopened.get(record.id,run.id),saved);
    assert.equal((await reopened.list(record.id)).runs[0].progress.passed,1);
    await assert.rejects(()=>reopened.update(record.id,run.id,{action:'case',expectedRevision:run.revision,caseId:'A02',outcome:'Passed',notes:''}),ConflictError);
    currentHead='e'.repeat(40);
    await assert.rejects(()=>reopened.update(record.id,run.id,{action:'case',expectedRevision:saved.revision,caseId:'A02',outcome:'Passed',notes:''}),ConflictError);
    await assert.rejects(()=>reopened.create(record.id,start),ConflictError);
    const later=await reopened.create(record.id,{...start,expectedHead:currentHead});
    assert.notEqual(later.id,run.id);assert.equal(later.results.length,0);assert.equal((await reopened.list(record.id)).runs.length,2);
    currentRecord={...record,revision:'f'.repeat(64)};
    await assert.rejects(()=>reopened.update(record.id,later.id,{action:'case',expectedRevision:later.revision,caseId:'A01',outcome:'Passed',notes:''}),ConflictError);
    assert.deepEqual(await reopened.get(record.id,run.id),saved);
    const file=join(root,'acceptance.local',record.id+'.'+run.id+'.json');
    assert.equal(JSON.parse(await readFile(file,'utf8')).testedRevision,head);
    assert.equal((await reopened.list('another-test')).runs.length,0);
    const other=join(root,'other');await mkdir(other);
    assert.equal((await new AcceptanceStore(other,scope).list(record.id)).runs.length,0);
    await writeFile(join(root,'acceptance.local','review.invalid.json'),'{}');
    assert.equal((await reopened.list(record.id)).errors.length,1);
  }finally{await rm(root,{recursive:true,force:true});}
});
test('a finalized run cannot be edited or accidentally replace a previous review',async()=>{
  const root=await mkdtemp(join(tmpdir(),'prism-acceptance-final-'));
  try{
    const store=new AcceptanceStore(root,async()=>({record,head,verification:null}));
    const input={expectedDefinitionRevision:definitionRevision,expectedHead:head,reviewer:'Reviewer',environment:'Fixture'};
    const run=await store.create(record.id,input);
    const failed=await store.update(record.id,run.id,{action:'case',expectedRevision:run.revision,caseId:'A01',outcome:'Failed',notes:'Observed mismatch'});
    const closed=await store.update(record.id,run.id,{action:'decision',expectedRevision:failed.revision,decision:'changes-requested',notes:'Fix and retest'});
    assert.equal(closed.decision,'changes-requested');
    await assert.rejects(()=>store.update(record.id,run.id,{action:'case',expectedRevision:closed.revision,caseId:'A02',outcome:'Passed',notes:''}),ConflictError);
    const next=await store.create(record.id,input);
    assert.equal(next.results.length,0);assert.deepEqual(await store.get(record.id,run.id),closed);
  }finally{await rm(root,{recursive:true,force:true});}
});

test('review handoff identifies exact revision and pending cases without claiming unrecorded success',()=>{
  const one=applyAcceptanceUpdate(data,{action:'case',expectedRevision:expected,caseId:'A01',outcome:'Failed',notes:'<b>Mismatch</b> @someone'},date);
  const summary=reviewSummary(one);assert.ok(summary.includes(head));assert.ok(summary.includes(definitionRevision));assert.ok(summary.includes('**Failed**'));assert.ok(summary.includes('**Pending**'));assert.ok(summary.includes('Local npm verification: not recorded'));assert.ok(summary.includes('&lt;b&gt;Mismatch&lt;/b&gt; &#64;someone'));assert.ok(!summary.includes('@someone'));
});

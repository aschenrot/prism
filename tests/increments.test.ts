import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp,mkdir,writeFile,rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { recordSchema,type ProjectRecord,type Editable,type Relationship } from '../shared/records';
import { scopeFor,scopeReview,milestoneIncrements } from '../shared/increments';
import { relationshipIssue } from '../shared/relationships';
import { browserVerificationSchema,browserVerificationState } from '../shared/browserVerification';
import { readBrowserVerification } from '../server/verification';
import type { AcceptanceSummary } from '../shared/acceptance';
const head='a'.repeat(40),rev='b'.repeat(64),now='2026-11-24T08:00:00.000Z';
function make(id:string,type:Editable['type'],relationships:Relationship[]=[]):ProjectRecord{return {...recordSchema.parse({id,title:id,type,relationships,status:'Concept',priority:'Normal',accent:'teal',tags:[],body:'Description'}),revision:rev};}
test('increment scope only follows explicit contains edges; missing and invalid members stay visible',()=>{
 const task=make('task','Task'),generic=make('generic','Task'),testRecord=make('test','Test'),wrong=make('wrong','Feature');
 const increment=make('increment','Increment',[{kind:'contains',target:task.id},{kind:'contains',target:task.id},{kind:'contains',target:testRecord.id},{kind:'contains',target:'missing'},{kind:'contains',target:wrong.id},generic.id]);
 const milestone=make('milestone','Milestone',[{kind:'contains',target:increment.id}]);
 const all=[increment,task,generic,testRecord,wrong,milestone],scope=scopeFor(increment,all);
 assert.deepEqual(scope.tasks.map(r=>r.id),[task.id]);assert.deepEqual(scope.tests.map(r=>r.id),[testRecord.id]);assert.equal(scope.ready,0);assert.equal(scope.linked,0);assert.equal(scope.issues.length,2);assert.deepEqual(scope.milestones,[milestone]);assert.deepEqual(milestoneIncrements(milestone,all),[increment]);assert.ok(relationshipIssue('contains','Increment','Increment'));
});
test('review rollup requires exact revision and explicit latest decision',()=>{
 const record={...make('review','Test'),tags:['acceptance'],body:'## Review instructions\nUse fixture.\n\n## U. UX\n- [ ] U01 — **Check** — Inspect. Expected: Works.\n'};
 const run:AcceptanceSummary={id:'run',testId:record.id,testedRevision:head,definitionRevision:rev,reviewer:'Fixture',environment:'Test',startedAt:now,updatedAt:now,decision:'accepted',progress:{total:1,passed:1,failed:0,blocked:0,pending:0}};
 assert.equal(scopeReview(record,head,{runs:[run],errors:[]}).state,'accepted');
 assert.equal(scopeReview(record,'c'.repeat(40),{runs:[run],errors:[]}).state,'historical');
 assert.equal(scopeReview(record,head,{runs:[run],errors:[{file:'bad',message:'Invalid'}]}).state,'unknown');
 assert.equal(scopeReview(record,head,{runs:[run,{...run,id:'newer',startedAt:'2026-11-24T09:00:00.000Z',decision:'open'}],errors:[]}).state,'pending');
});
test('browser evidence validates eligibility, exact revision and bounded local files',async()=>{
 const root=await mkdtemp(join(tmpdir(),'prism-browser-report-'));
 try{
  const report=browserVerificationSchema.parse({version:1,source:'local-playwright',revision:head,endingRevision:head,cleanAtStart:true,cleanAtEnd:true,startedAt:now,finishedAt:now,environment:{platform:'test',arch:'x64',node:'v26',playwright:'1.65.1',browser:'chromium'},buildExitCode:0,browserExitCode:0,stats:{passed:16,failed:0,skipped:0,flaky:0},minimumScenarios:16,eligible:true,reportDirectory:'9b8e2d6d-b7b2-4630-9037-7183e1ec7669'});
  assert.equal(browserVerificationState(report,head),'passed');assert.equal(browserVerificationState(report,'c'.repeat(40)),'historical');assert.equal(browserVerificationState({...report,cleanAtEnd:false},head),'diagnostic');assert.equal(browserVerificationSchema.safeParse({...report,stats:{...report.stats,failed:1}}).success,false);assert.equal(browserVerificationSchema.safeParse({...report,minimumScenarios:17}).success,false);
  assert.equal((await readBrowserVerification(root)).state,'unavailable');const dir=join(root,'.prism','cache','browser');await mkdir(dir,{recursive:true});await writeFile(join(dir,'latest.json'),JSON.stringify(report));assert.equal((await readBrowserVerification(root)).state,'available');await writeFile(join(dir,'latest.json'),'x'.repeat(65537));assert.equal((await readBrowserVerification(root)).state,'error');
 }finally{await rm(root,{recursive:true,force:true});}
});

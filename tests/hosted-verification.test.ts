import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readHostedRuns } from '../server/hostedVerification';
import { githubRepositorySchema,hostedRevisionRelation,hostedRunOutcome,hostedRunUrl } from '../shared/hostedVerification';
import { registrySchema } from '../shared/projects';
const sha='a'.repeat(40);
const row={id:42,name:'Verify',head_branch:'main',head_sha:sha,event:'pull_request',status:'completed',conclusion:'success',run_attempt:1,updated_at:'2026-11-24T10:00:00Z',pull_requests:[{number:13},{number:13}]};
const response=(value:unknown,status=200)=>new Response(JSON.stringify(value),{status});
test('hosted evidence only requests an explicitly validated public GitHub repository',async()=>{
 for(const value of ['https://example.org/a','a/../b','a/..','a/b?secret=1','a/b%2Ffoo','a\\b'])assert.equal(githubRepositorySchema.safeParse(value).success,false);
 let calls=0;
 const result=await readHostedRuns('owner/project',async(input,init)=>{calls++;assert.equal(input,'https://api.github.com/repos/owner/project/actions/runs?per_page=10');assert.equal(init?.method,'GET');assert.equal(init?.redirect,'error');assert.ok(init?.signal);assert.equal(new Headers(init?.headers).has('authorization'),false);return response({total_count:12,workflow_runs:[{...row,html_url:'https://example.org/evil',actor:{login:'not-needed'}}]});});
 assert.equal(calls,1);assert.equal(result.state,'available');
 if(result.state==='available'){assert.equal(result.total,12);assert.deepEqual(result.runs[0].pullRequests,[13]);assert.equal(result.runs[0].head,sha);assert.equal('html_url' in result.runs[0],false);}
 assert.equal((await readHostedRuns('owner/..',async()=>{throw Error('Unexpected request');})).state,'error');
 assert.equal(hostedRunUrl('owner/project',42),'https://github.com/owner/project/actions/runs/42');
});
test('hosted evidence reports unavailable, invalid and oversized responses honestly',async()=>{
 for(const status of [403,404,429])assert.equal((await readHostedRuns('owner/project',async()=>response({},status))).state,'unavailable');
 for(const value of [{}, {total_count:1,workflow_runs:[{...row,head_sha:'bad'}]},{total_count:11,workflow_runs:Array(11).fill(row)}])assert.equal((await readHostedRuns('owner/project',async()=>response(value))).state,'error');
 assert.equal((await readHostedRuns('owner/project',async()=>new Response('x'.repeat(1_000_001)))).state,'error');
 assert.equal((await readHostedRuns('owner/project',async()=>{throw Error('offline');})).state,'error');
});
test('hosted outcome and revision provenance never substitute for exact checkout evidence',()=>{
 assert.equal(hostedRunOutcome({status:'completed',conclusion:'success'}),'passed');
 assert.equal(hostedRunOutcome({status:'in_progress',conclusion:'success'}),'pending');
 assert.equal(hostedRunOutcome({status:'completed',conclusion:'skipped'}),'not-passed');
 assert.equal(hostedRevisionRelation({head:sha,event:'pull_request'},sha),'pr-head');
 assert.equal(hostedRevisionRelation({head:sha,event:'push'},sha),'reported-head');
 assert.equal(hostedRevisionRelation({head:sha,event:'push'},'b'.repeat(40)),'different');
 assert.equal(hostedRevisionRelation({head:sha,event:'push'},undefined),'unknown');
});
test('registry remains backward compatible and rejects GitHub on standalone projects',()=>{
 const base={id:'project',title:'Project',root:'.',storage:'repository'};
 assert.equal(registrySchema.safeParse([base]).success,true);
 assert.equal(registrySchema.safeParse([{...base,githubRepository:'owner/project'}]).success,true);
 assert.equal(registrySchema.safeParse([{...base,storage:'standalone',githubRepository:'owner/project'}]).success,false);
 assert.equal(registrySchema.safeParse([{...base,githubRepository:'https://example.org'}]).success,false);
});

import {test} from 'node:test';
import assert from 'node:assert/strict';
import {dependencyPlan} from '../shared/dependencies';
import {recordSchema,type ProjectRecord,type Relationship} from '../shared/records';
const rec=(id:string,relationships:Relationship[]=[],status:ProjectRecord['status']='Concept'):ProjectRecord=>({...recordSchema.parse({id,title:id,type:'Task',status,priority:'Normal',accent:'teal',tags:[],relationships,body:''}),revision:'a'.repeat(64)});
test('normalize explicit dependency directions, deduplicate edges and report known/missing prerequisites',()=>{
 const a=rec('a',[{kind:'blocks',target:'b'},{kind:'blocks',target:'b'},'c'],'Ready'),b=rec('b',[{kind:'depends-on',target:'a'}]),c=rec('c',[{kind:'depends-on',target:'missing'}]),d=rec('d',[{kind:'depends-on',target:'b'}]);
 const plan=dependencyPlan([a,b,c,d]);
 assert.equal(plan.get('a')?.state,'none');assert.equal(plan.get('b')?.state,'satisfied');assert.equal(plan.get('b')?.prerequisites.length,1);assert.deepEqual(plan.get('b')?.prerequisites[0].assertions,['blocks','depends-on']);
 assert.equal(plan.get('c')?.state,'unresolved');assert.equal(plan.get('d')?.state,'waiting');assert.deepEqual(plan.get('a')?.dependents.map(l=>l.id),['b']);
});
test('identify actual cycle members, self edges and not downstream dependents without recursion',()=>{
 const a=rec('a',[{kind:'depends-on',target:'b'}]),b=rec('b',[{kind:'depends-on',target:'a'},{kind:'blocks',target:'c'}]),c=rec('c'),d=rec('d',[{kind:'depends-on',target:'d'}]);
 const plan=dependencyPlan([a,b,c,d]);assert.equal(plan.get('a')?.state,'cycle');assert.equal(plan.get('b')?.state,'cycle');assert.equal(plan.get('d')?.state,'cycle');assert.equal(plan.get('c')?.state,'waiting');assert.equal(plan.get('c')?.cycle,false);
 const chain=Array.from({length:3000},(_,i)=>rec('r'+i,i?[{kind:'depends-on',target:'r'+(i-1)}]:[]));assert.equal(dependencyPlan(chain).get('r2999')?.cycle,false);
});

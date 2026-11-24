import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp,rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { RecordStore,ConflictError,CustomPropertyError } from '../server/store';
import { TemplateStore } from '../server/templates';
import { templateInputSchema,templateValues,type TemplateInput } from '../shared/templates';
const input:TemplateInput={name:'Review task',title:'Review',type:'Task',priority:'High',accent:'teal',tags:['review'],body:'## Review\n- [ ] Inspect changes',customProperties:{estimate:5}};
test('template instantiation is revision-bound, schema-checked and creates independent Concept records',async()=>{
 const root=await mkdtemp(join(tmpdir(),'prism-templates-'));try{
 const records=await RecordStore.open(root),templates=await TemplateStore.open(root);
 const schema=await records.schema();assert.equal(schema.state,'available');if(schema.state!=='available')return;
 const next=await records.updateSchema(schema.revision,{version:1,fields:[{id:'estimate',label:'Estimate',kind:'number'}]});assert.equal(next.state,'available');if(next.state!=='available')return;
 const t=await templates.create(input);assert.equal((await templates.get(t.id)).revision,t.revision);
 await assert.rejects(records.instantiateTemplate(templates,t.id,t.revision,'First','a'.repeat(64)),CustomPropertyError);
 assert.equal((await records.list()).records.length,0);
 const first=await records.instantiateTemplate(templates,t.id,t.revision,'First',next.revision);
 assert.equal(first.status,'Concept');assert.equal(first.priority,'High');assert.deepEqual(first.relationships,[]);assert.equal(first.customProperties?.estimate,5);assert.equal(first.implementationCommits,undefined);assert.equal(first.githubPullRequests,undefined);
 const renamed=await templates.update(t.id,t.revision,{...templateValues(t),body:'New body'});
 await assert.rejects(templates.update(t.id,t.revision,input),ConflictError);
 await assert.rejects(records.instantiateTemplate(templates,t.id,t.revision,'Stale',next.revision),ConflictError);
 const second=await records.instantiateTemplate(templates,t.id,renamed.revision,'Second',next.revision);assert.notEqual(second.id,first.id);assert.equal(second.body,'New body');assert.equal((await records.get(first.id)).body,input.body);
 const retired=await templates.update(t.id,renamed.revision,{...templateValues(renamed),retired:true});
 await assert.rejects(records.instantiateTemplate(templates,t.id,retired.revision,'Retired',next.revision),ConflictError);
 assert.equal((await records.list()).records.length,2);
 assert.equal(templateInputSchema.safeParse({...input,status:'Ready'}).success,false);assert.equal(templateInputSchema.safeParse({...input,tags:['acceptance']}).success,false);
 }finally{await rm(root,{recursive:true,force:true});}
});

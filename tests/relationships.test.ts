import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp,rm,readFile,writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { stringify } from 'yaml';
import { recordSchema,editableSchema,type ProjectRecord,type Editable,type Relationship } from '../shared/records';
import { normalizeRelationship,relationshipsFor,relationshipIssue,relationshipLabels } from '../shared/relationships';
import { auditRecords } from '../shared/audit';
import { RecordStore } from '../server/store';

function make(id:string,type:Editable['type'],relationships:Relationship[]=[]):ProjectRecord{
  return {...recordSchema.parse({id,title:id,type,status:'Concept',priority:'Normal',accent:'teal',tags:[],relationships,body:'Description'}),revision:'a'.repeat(64)};
}
test('legacy and typed edges coexist with directional backlinks and no inferred coverage',()=>{
  const requirement=make('requirement','Requirement');
  const generic=make('generic','Test',['requirement']);
  const explicit=make('explicit','Test',[{kind:'verifies',target:'requirement'},'requirement',{kind:'verifies',target:'requirement'}]);
  const all=[requirement,generic,explicit];
  assert.deepEqual(normalizeRelationship('requirement'),{kind:'related-to',target:'requirement'});
  const links=relationshipsFor(all,requirement.id);
  assert.equal(links.incoming.length,3);
  assert.equal(links.incoming.filter(edge=>edge.kind==='verifies').length,1);
  assert.equal(links.incoming.find(edge=>edge.kind==='verifies')?.id,'explicit');
  assert.equal(relationshipLabels.verifies.incoming,'Verified by');
  assert.equal(relationshipsFor(all,'explicit').outgoing.length,2);
  assert.deepEqual(auditRecords(all),[]);
});
test('endpoint constraints and unresolved typed links are explicit audit findings',()=>{
  const task=make('task','Task',[{kind:'verifies',target:'req'},{kind:'blocks',target:'missing'},{kind:'depends-on',target:'task'}]);
  const req=make('req','Requirement');
  assert.ok(relationshipIssue('verifies','Task','Requirement'));
  assert.equal(relationshipIssue('implements','System','Requirement'),undefined);
  assert.deepEqual(auditRecords([task,req]).map(f=>f.title).sort(),['Invalid relationship endpoints','Self-reference','Unresolved record link']);
  const {id:_,revision:__,...fields}=req;
  assert.equal(editableSchema.safeParse(fields).success,true);
  assert.equal(editableSchema.safeParse({...fields,relationships:[{kind:'unknown',target:'task'}]}).success,false);
  assert.equal(editableSchema.safeParse({...fields,relationships:[{kind:'verifies',target:'../escape'}]}).success,false);
});
test('editing a legacy record round trips typed edges and unknown metadata',async()=>{
  const root=await mkdtemp(join(tmpdir(),'prism-typed-links-'));
  try{
    const store=await RecordStore.open(root);
    const record=make('test','Test',['requirement']);
    const {revision:_,body,...meta}=record;
    const path=join(root,'records','test.md');
    await writeFile(path,'---\n'+stringify({...meta,custom:'preserve'})+'---\n'+body);
    const before=await store.get('test');
    assert.deepEqual(before.relationships,['requirement']);
    const fields:Editable={title:before.title,type:before.type,status:before.status,priority:before.priority,accent:before.accent,tags:before.tags,body:before.body,relationships:[...before.relationships,{kind:'verifies',target:'requirement'}]};
    await store.update(before.id,before.revision,fields);
    const reopened=await (await RecordStore.open(root)).get('test');
    assert.deepEqual(reopened.relationships,fields.relationships);
    assert.equal(reopened.custom,'preserve');
    assert.match(await readFile(path,'utf8'),/kind: verifies/);
  }finally{await rm(root,{recursive:true,force:true});}
});

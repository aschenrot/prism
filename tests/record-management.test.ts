import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp,rm,readFile,writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { RecordStore,ConflictError } from '../server/store';
import { editableRecord } from '../shared/editor';
import { propertyUpdateSchema } from '../shared/records';

test('property changes are revision checked, preserve unrelated fields and reject unrelated mutation keys',async()=>{
 const root=await mkdtemp(join(tmpdir(),'prism-properties-'));
 try{
  const store=await RecordStore.open(root),r=await store.create('Original','Task');
  const raw=await readFile(join(root,'records',r.id+'.md'),'utf8');
  await writeFile(join(root,'records',r.id+'.md'),raw.replace('---\n','---\ncustom: keep-me\n'));
  const before=await store.get(r.id);
  const edited=await store.update(before.id,before.revision,{...editableRecord(before),body:'Keep notes',relationships:['other-id']});
  await assert.rejects(store.updateProperties(edited.id,before.revision,{status:'Ready'}),ConflictError);
  const next=await store.updateProperties(edited.id,edited.revision,{status:'In progress',priority:'High'});
  assert.equal(next.body,'Keep notes');assert.deepEqual(next.relationships,['other-id']);assert.equal(next.custom,'keep-me');assert.equal(next.status,'In progress');assert.equal(next.priority,'High');assert.equal(next.createdAt,edited.createdAt);
  assert.equal((await store.updateProperties(next.id,next.revision,{priority:'High'})).revision,next.revision);
  assert.equal(propertyUpdateSchema.safeParse({expectedRevision:next.revision,changes:{}}).success,false);
  assert.equal(propertyUpdateSchema.safeParse({expectedRevision:next.revision,changes:{title:'Unauthorized'}}).success,false);
 }finally{await rm(root,{recursive:true,force:true});}
});
test('duplicate creates independent concept content without inheriting scope or delivery evidence',async()=>{
 const root=await mkdtemp(join(tmpdir(),'prism-duplicate-'));
 try{
  const store=await RecordStore.open(root),r=await store.create('A'.repeat(160),'Test');
  const saved=await store.update(r.id,r.revision,{...editableRecord(r),status:'Ready',body:'Test instructions',tags:['acceptance','current','blocker','custom'],relationships:['linked-record']});
  const path=join(root,'records',saved.id+'.md');
  const raw=await readFile(path,'utf8');await writeFile(path,raw.replace('---\n','---\nimplementationCommits: ["'+'a'.repeat(40)+'"]\ncustom: private\n'));
  const source=await store.get(saved.id);
  await assert.rejects(store.duplicate(source.id,saved.revision),ConflictError);
  const copy=await store.duplicate(source.id,source.revision);
  assert.notEqual(copy.id,source.id);assert.ok(copy.title.endsWith(' (copy)'));assert.equal(copy.title.length,160);
  assert.equal(copy.status,'Concept');assert.equal(copy.body,source.body);assert.deepEqual(copy.tags,['custom']);assert.deepEqual(copy.relationships,[]);
  assert.equal(copy.implementationCommits,undefined);assert.equal(copy.custom,undefined);assert.ok(copy.createdAt);assert.equal(copy.createdAt,copy.updatedAt);
  assert.equal((await store.get(source.id)).revision,source.revision);
 }finally{await rm(root,{recursive:true,force:true});}
});

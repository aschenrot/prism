import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp,rm,readFile,writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { RecordStore,ConflictError,MissingError } from '../server/store';
test('trash retains exact bytes and stable ID; stale moves and restores never overwrite a record',async()=>{
 const root=await mkdtemp(join(tmpdir(),'prism-trash-'));
 try{
  const store=await RecordStore.open(root),r=await store.create('Trash fixture','Task');
  const path=join(root,'records',r.id+'.md'),raw=await readFile(path);
  await assert.rejects(store.moveToTrash(r.id,'b'.repeat(64)),ConflictError);
  assert.equal((await store.list()).records.length,1);
  const moved=await store.moveToTrash(r.id,r.revision);
  assert.equal(moved.revision,r.revision);await assert.rejects(store.get(r.id),MissingError);
  const reopened=await RecordStore.open(root);assert.equal((await reopened.listTrash()).records[0].id,r.id);
  assert.deepEqual(await readFile(join(root,'trash',r.id,r.id+'.md')),raw);
  await assert.rejects(reopened.restoreTrash(r.id,'b'.repeat(64)),ConflictError);
  await writeFile(path,raw);await assert.rejects(reopened.restoreTrash(r.id,r.revision),ConflictError);
  assert.equal((await reopened.listTrash()).records.length,1);
  await rm(path);
  const restored=await reopened.restoreTrash(r.id,r.revision);
  assert.equal(restored.revision,r.revision);assert.deepEqual(await readFile(path),raw);
  assert.equal((await reopened.listTrash()).records.length,0);
  await assert.rejects(reopened.moveToTrash('../bad',r.revision));
 }finally{await rm(root,{recursive:true,force:true});}
});

test('timestamps are authored by successful record saves, not guessed for legacy records or changed by trash',async()=>{
 const root=await mkdtemp(join(tmpdir(),'prism-time-'));try{const store=await RecordStore.open(root),r=await store.create('New','Task');assert.ok(r.createdAt);assert.equal(r.createdAt,r.updatedAt);const path=join(root,'records',r.id+'.md');const legacy=(await readFile(path,'utf8')).replace(/^createdAt:.*\r?\n|^updatedAt:.*\r?\n/gm,'');await writeFile(path,legacy);const prior=await store.get(r.id);assert.equal(prior.createdAt,undefined);assert.equal(prior.updatedAt,undefined);const editable={title:prior.title,type:prior.type,status:prior.status,priority:prior.priority,accent:prior.accent,tags:prior.tags,relationships:prior.relationships,body:prior.body};assert.equal((await store.update(prior.id,prior.revision,editable)).revision,prior.revision);const changed=await store.update(prior.id,prior.revision,{...editable,title:'Edited'});assert.equal(changed.createdAt,undefined);assert.ok(changed.updatedAt);await store.moveToTrash(changed.id,changed.revision);const restored=await store.restoreTrash(changed.id,changed.revision);assert.equal(restored.updatedAt,changed.updatedAt);assert.equal(restored.revision,changed.revision);}finally{await rm(root,{recursive:true,force:true});}
});

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

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { RecordStore, ConflictError } from '../server/store';
import { type Editable } from '../shared/records';
const fields = (r:Awaited<ReturnType<RecordStore['create']>>):Editable => ({title:r.title,type:r.type,status:r.status,priority:r.priority,accent:r.accent,tags:r.tags,relationships:r.relationships,body:r.body});
test('persists and reopens a record; rejects a stale revision',async()=>{
  const root=await mkdtemp(join(tmpdir(),'prism-'));
  try{
    const store=await RecordStore.open(root);
    const record=await store.create('Fire magic','Mechanic');
    const next=await store.update(record.id,record.revision,{...fields(record),status:'In progress',body:'An elemental combat mechanic.'});
    const reopened=await RecordStore.open(root);
    assert.equal((await reopened.get(record.id)).status,'In progress');
    assert.equal((await reopened.get(record.id)).body,next.body);
    await assert.rejects(store.update(record.id,record.revision,fields(record)),ConflictError);
  }finally{await rm(root,{recursive:true,force:true});}
});
test('reports malformed external records; rejects traversal',async()=>{
  const root=await mkdtemp(join(tmpdir(),'prism-'));
  try{
    const store=await RecordStore.open(root);
    await writeFile(join(root,'records','bad.md'),'invalid');
    assert.equal((await store.list()).errors[0].file,'bad.md');
    await assert.rejects(store.get('../bad'));
  }finally{await rm(root,{recursive:true,force:true});}
});

test('authored PR references survive ordinary updates and never transfer to a duplicate',async()=>{
 const root=await mkdtemp(join(tmpdir(),'prism-pr-ref-'));
 try{
  const store=await RecordStore.open(root),created=await store.create('Scoped delivery','Increment');
  const path=join(root,'records',created.id+'.md'),raw=await readFile(path,'utf8');
  await writeFile(path,raw.replace(/^---\r?\n/,'---\ngithubPullRequests: [{repository: owner/project, number: 13}]\n'));
  const loaded=await store.get(created.id);assert.deepEqual(loaded.githubPullRequests,[{repository:'owner/project',number:13}]);
  const next=await store.update(loaded.id,loaded.revision,{...fields(loaded),body:'updated'});
  assert.deepEqual(next.githubPullRequests,loaded.githubPullRequests);
  const copy=await store.duplicate(next.id,next.revision);assert.equal(copy.githubPullRequests,undefined);
  await assert.rejects(store.update(loaded.id,loaded.revision,fields(loaded)),ConflictError);
 }finally{await rm(root,{recursive:true,force:true});}
});

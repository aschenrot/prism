import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile, readFile,truncate } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { RecordStore, ConflictError,RecordContentError,RECORD_FILE_LIMIT } from '../server/store';
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

test('record revisions hash exact original UTF-8 bytes; invalid encoding never becomes replacement text',async()=>{
 const root=await mkdtemp(join(tmpdir(),'prism-record-encoding-'));
 try{
  const store=await RecordStore.open(root),r=await store.create('Unicode — 日本語','Task'),other=await store.create('Independent record','Task');
  const path=join(root,'records',r.id+'.md');
  const raw=(await readFile(path,'utf8')).replace(/\n/g,'\r\n')+'Valid �, emoji 🧩 and accents é\r\n';
  const bytes=Buffer.from(raw,'utf8');await writeFile(path,bytes);
  const loaded=await store.get(r.id);assert.equal(loaded.revision,createHash('sha256').update(bytes).digest('hex'));assert.match(loaded.body,/Valid �, emoji 🧩/);
  const invalid=Buffer.concat([bytes,Buffer.from([0xc0,0xaf])]);await writeFile(path,invalid);
  await assert.rejects(store.get(r.id),/not valid UTF-8/);
  await assert.rejects(store.update(r.id,loaded.revision,fields(loaded)),RecordContentError);
  assert.deepEqual(await readFile(path),invalid);
  const listed=await store.list();assert.deepEqual(listed.records.map(x=>x.id),[other.id]);assert.equal(listed.errors[0].file,r.id+'.md');
 }finally{await rm(root,{recursive:true,force:true});}
});
test('oversized external records are rejected without parsing; other records remain accessible',async()=>{
 const root=await mkdtemp(join(tmpdir(),'prism-record-size-'));
 try{
  const store=await RecordStore.open(root),r=await store.create('Oversized fixture','Task'),other=await store.create('Small fixture','Task');
  const path=join(root,'records',r.id+'.md');await truncate(path,RECORD_FILE_LIMIT+1);
  await assert.rejects(store.get(r.id),/16 MB limit/);
  const listed=await store.list();assert.deepEqual(listed.records.map(x=>x.id),[other.id]);assert.match(listed.errors[0].message,/16 MB limit/);
 }finally{await rm(root,{recursive:true,force:true});}
});
test('saving invalid Unicode leaves existing bytes and revision unchanged',async()=>{
 const root=await mkdtemp(join(tmpdir(),'prism-record-invalid-write-'));
 try{
  const store=await RecordStore.open(root),r=await store.create('Draft fixture','Task'),path=join(root,'records',r.id+'.md'),before=await readFile(path);
  await assert.rejects(store.update(r.id,r.revision,{...fields(r),body:'unpaired '+String.fromCharCode(0xd800)}),/invalid Unicode/);
  assert.deepEqual(await readFile(path),before);assert.equal((await store.get(r.id)).revision,r.revision);
 }finally{await rm(root,{recursive:true,force:true});}
});

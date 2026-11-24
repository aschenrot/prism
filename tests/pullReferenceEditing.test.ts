import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,readFile,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {RecordStore,ConflictError} from '../server/store';
import {pullReferenceDraft,parsePullReferenceDraft} from '../shared/pullReferenceEditing';
test('dedicated pull association command is revision-bound, increment-scoped and preserves unrelated metadata',async()=>{
 const root=await mkdtemp(join(tmpdir(),'prism-refs-'));try{
 const store=await RecordStore.open(root);let record=await store.create('Delivery','Increment');const path=join(root,'records',record.id+'.md');await writeFile(path,(await readFile(path,'utf8')).replace('---\n','---\nfutureMetadata: retained\n'));record=await store.get(record.id);
 const refs=[{repository:'example/project',number:12}],saved=await store.updatePullReferences(record.id,record.revision,refs);assert.deepEqual(saved.githubPullRequests,refs);assert.equal(saved.futureMetadata,'retained');assert.equal(saved.status,record.status);assert.equal(saved.body,record.body);
 assert.equal((await store.updatePullReferences(saved.id,saved.revision,refs)).revision,saved.revision);await assert.rejects(store.updatePullReferences(record.id,record.revision,[]),ConflictError);
 const task=await store.create('Task','Task');await assert.rejects(store.updatePullReferences(task.id,task.revision,refs),ConflictError);await assert.rejects(store.updatePullReferences(saved.id,saved.revision,[...refs,...refs]));
 const cleared=await store.updatePullReferences(saved.id,saved.revision,[]);assert.deepEqual(cleared.githubPullRequests,[]);assert.equal(cleared.futureMetadata,'retained');
 assert.deepEqual(parsePullReferenceDraft(pullReferenceDraft(saved.revision,refs).draft).data,refs);for(const number of ['0','1.2','1e2','9007199254740992'])assert.equal(parsePullReferenceDraft([{repository:'example/project',number}]).success,false);
 }finally{await rm(root,{recursive:true,force:true});}
});

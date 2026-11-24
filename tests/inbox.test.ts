import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp,rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { RecordStore,ConflictError,MissingError } from '../server/store';
import { captureSchema,inboxUpdateSchema } from '../shared/inbox';
import { editableSchema } from '../shared/records';
test('capture and triage preserve canonical data and reject stale revisions',async()=>{
 const root=await mkdtemp(join(tmpdir(),'prism-inbox-'));try{
 const store=await RecordStore.open(join(root,'one')),other=await RecordStore.open(join(root,'two'));
 const item=await store.capture('Captured thought','Original body');
 assert.equal(item.type,'Idea');assert.equal(item.status,'Concept');assert.equal(item.inbox,true);assert.equal(item.body,'Original body');
 assert.equal((await other.list()).records.length,0);await assert.rejects(other.setInbox(item.id,item.revision,false),MissingError);
 const edited=await store.updateProperties(item.id,item.revision,{priority:'High'});
 assert.equal(edited.inbox,true);assert.equal(edited.priority,'High');
 await assert.rejects(store.setInbox(item.id,item.revision,false),ConflictError);
 const copy=await store.duplicate(edited.id,edited.revision);assert.equal(copy.inbox,undefined);
 const completed=await store.setInbox(edited.id,edited.revision,false);
 assert.equal(completed.id,item.id);assert.equal(completed.body,item.body);assert.equal(completed.priority,'High');assert.equal(completed.inbox,false);
 assert.equal((await store.setInbox(completed.id,completed.revision,false)).revision,completed.revision);
 const requeued=await store.setInbox(completed.id,completed.revision,true);assert.equal(requeued.inbox,true);
 await store.moveToTrash(requeued.id,requeued.revision);assert.equal((await store.listTrash()).records[0].inbox,true);
 const restored=await store.restoreTrash(requeued.id,requeued.revision);assert.equal(restored.inbox,true);assert.equal(restored.id,item.id);
 assert.equal(captureSchema.safeParse({title:'Valid',body:'',status:'Ready'}).success,false);
 assert.equal(inboxUpdateSchema.safeParse({expectedRevision:item.revision,inbox:false,body:'overwrite'}).success,false);
 const ordinary={title:'Valid',type:'Idea',status:'Concept',priority:'Normal',accent:'violet',tags:[],relationships:[],body:''};assert.equal(editableSchema.safeParse(ordinary).success,true);assert.equal(editableSchema.safeParse({...ordinary,inbox:true}).success,false);
 }finally{await rm(root,{recursive:true,force:true});}
});

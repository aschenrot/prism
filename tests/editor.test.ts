import { test } from 'node:test';
import assert from 'node:assert/strict';
import { freshDraft,isDirty,compareDraft,reconcileDraft,editorDraftSchema } from '../shared/editor';
import { createDraftStorage } from '../src/draftStorage';
import { recordSchema,type ProjectRecord } from '../shared/records';
function record(overrides:Partial<ProjectRecord>={}):ProjectRecord{return {...recordSchema.parse({id:'task-a',title:'Original',type:'Task',status:'Concept',priority:'Normal',accent:'teal',tags:['one'],relationships:[],body:'Original body'}),revision:'a'.repeat(64),...overrides};}
function memory(){
  const items=new Map<string,string>();
  return {getItem:(key:string)=>items.get(key)??null,setItem:(key:string,value:string)=>{items.set(key,value);},removeItem:(key:string)=>{items.delete(key);}};
}
test('recovery round trips incomplete edits and keeps projects separate',()=>{
  const store=memory(),first=createDraftStorage(()=>store);
  const base=freshDraft(record());
  assert.equal(isDirty(base),false);
  const draft={...base,draft:{...base.draft,title:'',tags:['one',''],body:'Unsaved text'}};
  assert.equal(isDirty(draft),true);
  assert.equal(editorDraftSchema.safeParse(draft).success,true);
  const write=first.write('prism','task-a',null,draft);assert.equal(write.state,'stored');
  const reopened=createDraftStorage(()=>store).read('prism','task-a');
  assert.equal(reopened.state,'available');
  if(reopened.state!=='available')throw Error('Missing recovery');
  assert.deepEqual(reopened.draft,draft);
  assert.equal(first.read('other','task-a').state,'empty');
  assert.equal(first.read('prism','task-b').state,'empty');
  assert.equal(first.write('prism','task-a',reopened.token,null).state,'stored');
  assert.equal(first.read('prism','task-a').state,'empty');
});
test('reconcile independent edits without overwriting disk-only fields',()=>{
  const base=freshDraft(record()),session={...base,draft:{...base.draft,title:'My title'}};
  const current=record({status:'In progress',body:'External body',revision:'b'.repeat(64)});
  assert.deepEqual(compareDraft(session,current).conflicts,[]);
  const next=reconcileDraft(session,current,{});assert.ok(next);
  assert.equal(next.baseRevision,current.revision);assert.equal(next.draft.title,'My title');assert.equal(next.draft.body,'External body');assert.equal(next.draft.status,'In progress');
});
test('overlapping edits require explicit decisions; identical edits are not conflicts',()=>{
  const base=freshDraft(record()),session={...base,draft:{...base.draft,title:'My title',body:'Same body'}};
  const current=record({title:'External title',body:'Same body',revision:'b'.repeat(64)});
  assert.deepEqual(compareDraft(session,current).conflicts,['title']);
  assert.equal(reconcileDraft(session,current,{}),null);
  const keep=reconcileDraft(session,current,{title:'local'});assert.equal(keep?.draft.title,'My title');
  const disk=reconcileDraft(session,current,{title:'disk'});assert.ok(disk);assert.equal(isDirty(disk),false);
});
test('draft storage rejects competing edits and preserves newer recovery data',()=>{
  const store=memory(),a=createDraftStorage(()=>store),b=createDraftStorage(()=>store);
  const base=freshDraft(record());
  const first={...base,draft:{...base.draft,title:'First'}},second={...base,draft:{...base.draft,title:'Second'}};
  assert.equal(a.write('prism','task-a',null,first).state,'stored');
  assert.equal(b.write('prism','task-a',null,second).state,'conflict');
  assert.equal(b.write('prism','task-a',null,null).state,'conflict');
  const current=b.read('prism','task-a');assert.equal(current.state,'available');
  if(current.state==='available')assert.equal(current.draft.draft.title,'First');
});
test('invalid and inaccessible recovery storage is reported, not a successful save',()=>{
  const base=freshDraft(record()),invalid=createDraftStorage(()=>({getItem:()=>'{broken',setItem:()=>{},removeItem:()=>{}}));
  assert.equal(invalid.read('prism','task-a').state,'invalid');
  const unavailable=createDraftStorage(()=>{throw Error('quota');});
  assert.equal(unavailable.read('prism','task-a').state,'unavailable');assert.equal(unavailable.write('prism','task-a',null,base).state,'unavailable');
  assert.equal(editorDraftSchema.safeParse({...base,baseRevision:'invalid'}).success,false);
});

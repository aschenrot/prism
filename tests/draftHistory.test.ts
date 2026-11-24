import {test} from 'node:test';
import assert from 'node:assert/strict';
import {emptyDraftHistory,recordDraftEdit,stepDraftHistory,endDraftGroup} from '../shared/draftHistory';
import {freshDraft,type EditorDraft} from '../shared/editor';
import {recordSchema} from '../shared/records';
const base=()=>freshDraft({...recordSchema.parse({id:'task',title:'Original',type:'Task',status:'Concept',priority:'Normal',accent:'teal',tags:[],relationships:[],body:''}),revision:'a'.repeat(64)});
const title=(session:EditorDraft,title:string):EditorDraft=>({...session,draft:{...session.draft,title}});
test('typing groups undo and redo; discrete commands split groups and new edits clear redo',()=>{
 const a=base(),b=title(a,'A'),c=title(a,'AB'),d={...c,draft:{...c.draft,status:'In progress' as const}};
 let h=recordDraftEdit(emptyDraftHistory(),a,b,'title',0);h=recordDraftEdit(h,b,c,'title',100);assert.equal(h.past.length,1);
 h=recordDraftEdit(h,c,d,undefined,200);assert.equal(h.past.length,2);
 const first=stepDraftHistory(h,d,'undo',a.updatedAt);assert.ok(first);assert.deepEqual(first.session.draft,c.draft);
 const second=stepDraftHistory(first.history,first.session,'undo',a.updatedAt);assert.ok(second);assert.deepEqual(second.session.draft,a.draft);
 const redo=stepDraftHistory(second.history,second.session,'redo',a.updatedAt);assert.ok(redo);assert.deepEqual(redo.session.draft,c.draft);
 assert.equal(recordDraftEdit(redo.history,redo.session,title(c,'New'),undefined,300).future.length,0);
});
test('history is bounded, cannot cross revision boundaries, and respects blur and typing gaps',()=>{
 const a=base(),b=title(a,'B'),c=title(a,'C');let h=recordDraftEdit(emptyDraftHistory(),a,b,'title',0);
 h=recordDraftEdit(endDraftGroup(h),b,c,'title',10);assert.equal(h.past.length,2);
 h=recordDraftEdit(h,c,a,'title',1000);assert.equal(h.past.length,3);
 let last=a;
 for(let i=0;i<80;i++){const next=title(a,'Change '+i);h=recordDraftEdit(h,last,next,undefined,i);last=next;}
 assert.equal(h.past.length,40);assert.equal(stepDraftHistory(h,{...last,baseRevision:'b'.repeat(64)},'undo',a.updatedAt),null);
 assert.equal(recordDraftEdit(h,last,{...last,baseRevision:'b'.repeat(64)},undefined,0).past.length,0);
});

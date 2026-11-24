import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createDraftStorage} from '../src/draftStorage';
test('recovery inventory is project scoped, validates identities and leaves unreadable copies discoverable',()=>{
 const values=new Map([['prism:editor-draft:v1:one:task-a','broken'],['prism:editor-draft:v1:two:task-a','other'],['prism:editor-draft:v1:one:../bad','malformed'],['unrelated','value'],['prism:editor-draft:v1:one:task-b','broken']]);
 const storage={get length(){return values.size;},key:(i:number)=>[...values.keys()][i]??null,getItem:(k:string)=>values.get(k)??null,setItem:(k:string,v:string)=>{values.set(k,v);},removeItem:(k:string)=>{values.delete(k);}};
 const drafts=createDraftStorage(()=>storage);assert.deepEqual(drafts.list('one'),{state:'available',ids:['task-a','task-b']});assert.deepEqual(drafts.list('two').ids,['task-a']);
 const original=drafts.read('one','task-a');assert.equal(original.state,'invalid');values.set('prism:editor-draft:v1:one:task-a','new raw');assert.equal(drafts.write('one','task-a',original.token,null).state,'conflict');assert.equal(values.get('prism:editor-draft:v1:one:task-a'),'new raw');
 assert.deepEqual(createDraftStorage(()=>{throw Error('storage unavailable');}).list('one'),{state:'unavailable',ids:[]});
 const bounded=createDraftStorage(()=>({...storage,length:10001,key:()=>null}));assert.equal(bounded.list('one').state,'incomplete');
});

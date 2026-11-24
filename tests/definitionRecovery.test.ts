import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createFormRecovery} from '../src/formRecovery';
import {propertyFormSchema,templateFormSchema,type PropertyForm} from '../shared/definitionDrafts';
test('unfinished definition input survives reload, is project scoped and refuses competing writes',()=>{
 const memory=new Map<string,string>(),access=()=>({getItem:(k:string)=>memory.get(k)??null,setItem:(k:string,v:string)=>{memory.set(k,v);},removeItem:(k:string)=>{memory.delete(k);}});
 const form:PropertyForm={revision:'a'.repeat(64),base:{version:1,fields:[]},draft:{id:'',label:'',kind:'enum',options:[{id:'',label:''}],appliesTo:[]}};
 const a=createFormRecovery(access,'one','property',propertyFormSchema),b=createFormRecovery(access,'one','property',propertyFormSchema),other=createFormRecovery(access,'two','property',propertyFormSchema);
 assert.equal(a.read().state,'empty');const written=a.write(null,form);assert.equal(written.state,'stored');assert.equal(other.read().state,'empty');const resumed=b.read();assert.equal(resumed.state,'available');if(resumed.state==='available')assert.deepEqual(resumed.value,form);
 assert.equal(a.write(null,null).state,'conflict');assert.equal(b.write(resumed.token,{...form,draft:{id:'changed',label:'Name',kind:'text'}}).state,'stored');assert.equal(a.write(resumed.token,null).state,'conflict');
 memory.set(a.key,'invalid');assert.equal(a.read().state,'invalid');assert.equal(a.write('invalid',null).state,'stored');
 assert.equal(templateFormSchema.safeParse({original:null,draft:{name:'',title:'',type:'Task',priority:'Normal',accent:'teal',tags:['',''],body:''}}).success,true);
});

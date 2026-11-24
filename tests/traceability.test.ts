import {test} from 'node:test';
import assert from 'node:assert/strict';
import {traceabilityFor} from '../shared/traceability';
import {recordSchema,type ProjectRecord,type Relationship} from '../shared/records';
const rec=(id:string,type:ProjectRecord['type'],relationships:Relationship[]=[],status:ProjectRecord['status']='Concept'):ProjectRecord=>({...recordSchema.parse({id,title:id,type,status,priority:'Normal',accent:'teal',tags:[],relationships,body:''}),revision:'a'.repeat(64)});
test('traceability uses only valid explicit incoming edges and retains links outside the visible collection',()=>{
 const req=rec('req','Requirement'),feat=rec('feature','Feature'),task=rec('task','Task',[{kind:'implements',target:'req'},{kind:'implements',target:'req'}]),testRecord=rec('test','Test',[{kind:'verifies',target:'req'}],'Ready'),doc=rec('doc','Document',[{kind:'documents',target:'req'}]),invalid=rec('invalid','Task',[{kind:'verifies',target:'req'}]),generic=rec('generic','Task',['req']),self=rec('self','Feature',[{kind:'implements',target:'self'}]);
 const result=traceabilityFor([req,feat,task,testRecord,doc,invalid,generic,self],[req,feat,self]);assert.equal(result.rows.length,3);
 assert.deepEqual(result.rows[0].implementation.map(x=>x.id),['task']);assert.deepEqual(result.rows[0].tests.map(x=>x.id),['test']);assert.deepEqual(result.rows[0].documents.map(x=>x.id),['doc']);
 assert.equal(result.missingImplementation,2);assert.equal(result.missingTests,2);assert.equal(result.invalid,2);assert.equal(result.rows[0].invalid[0].source.id,'invalid');assert.equal(result.rows[2].invalid[0].issue,'Self-reference');
 assert.equal(traceabilityFor([req,task],[task]).rows.length,0);
});

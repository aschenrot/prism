import { test } from 'node:test';
import assert from 'node:assert/strict';
import { defaultTableColumns,columnFor,tableMinWidth,propertyColumnValue,availableColumns } from '../shared/tableColumns';
import { projectPropertySchema } from '../shared/customProperties';
import { recordSchema,type ProjectRecord } from '../shared/records';
test('default geometry and typed column values are deterministic; retirement preserves visibility',()=>{
 const schema=projectPropertySchema.parse({version:1,fields:[{id:'choice',label:'Choice',kind:'enum',options:[{id:'yes',label:'Confirmed'}]},{id:'ref',label:'Reference',kind:'reference'},{id:'flag',label:'Flag',kind:'boolean'},{id:'old',label:'Old',kind:'number',retired:true}]});
 const record:ProjectRecord={...recordSchema.parse({id:'one',title:'One',type:'Task',status:'Concept',priority:'High',accent:'teal',tags:[],relationships:[],body:'',customProperties:{choice:'yes',ref:'two',flag:false,old:7,unknown:'raw'}}),revision:'a'.repeat(64)};
 const records=new Map([['two',{...record,id:'two',title:'Target record'}]]);
 assert.deepEqual(defaultTableColumns(),['type','status','priority']);assert.equal(tableMinWidth(defaultTableColumns().map(id=>columnFor(id))),720);assert.equal(tableMinWidth(defaultTableColumns(true).map(id=>columnFor(id))),880);
 assert.equal(propertyColumnValue(record,'property:choice',schema,records),'Confirmed');assert.equal(propertyColumnValue(record,'property:ref',schema,records),'Target record');assert.equal(propertyColumnValue(record,'property:flag',schema,records),'No');
 assert.equal(propertyColumnValue(record,'property:old',schema,records),'7 (preserved)');assert.equal(propertyColumnValue(record,'property:unknown',schema,records),'raw (preserved)');assert.equal(propertyColumnValue(record,'property:missing',schema,records),'—');
 assert.equal(columnFor('property:old',schema).label,'Old (retired)');assert.equal(columnFor('property:unknown',schema).label,'Property: unknown (unavailable)');assert.ok(!availableColumns(schema).some(c=>c.id==='property:old'));
});

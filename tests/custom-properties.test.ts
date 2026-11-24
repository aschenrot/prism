import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp,writeFile,rm,readFile,symlink,mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { projectPropertySchema,customValuesSchema,customPropertyIssue,changedCustomKeys,schemaTransitionIssue } from '../shared/customProperties';
import { RecordStore,CustomPropertyError,ConflictError } from '../server/store';
import { editableRecord } from '../shared/editor';
import { readProjectSchema,SchemaWriteConflict,SchemaWriteRejected } from '../server/projectSchema';
const definition={version:1,fields:[{id:'effort',label:'Effort',kind:'number',appliesTo:['Task']},{id:'due',label:'Due',kind:'date'},{id:'state',label:'Review state',kind:'enum',options:[{id:'pending',label:'Pending'}]},{id:'objective',label:'Objective',kind:'reference',targetTypes:['Objective']},{id:'note',label:'Note',kind:'text'},{id:'checked',label:'Checked',kind:'boolean'}]};
test('versioned property definitions and scalar value limits reject invalid input',()=>{
 const parsed=projectPropertySchema.parse(definition);
 for(const value of [{...definition,version:2},{...definition,fields:[definition.fields[0],definition.fields[0]]},{version:1,fields:[{id:'constructor',label:'Bad',kind:'text'}]},{version:1,fields:[{id:'a',label:'Bad',kind:'number',code:'arbitrary'}]}])assert.equal(projectPropertySchema.safeParse(value).success,false);
 assert.equal(customValuesSchema.safeParse({effort:Infinity}).success,false);assert.equal(customValuesSchema.safeParse({nested:{}}).success,false);
 const field=(id:string)=>parsed.fields.find(f=>f.id===id)!;
 assert.equal(customPropertyIssue(field('due'),'Task','2026-02-30','a')!==undefined,true);
 assert.equal(customPropertyIssue(field('due'),'Task','2026-02-28','a'),undefined);
 assert.equal(customPropertyIssue(field('state'),'Task','missing','a')!==undefined,true);
 assert.equal(customPropertyIssue(field('checked'),'Task',false,'a'),undefined);
 assert.equal(customPropertyIssue(field('effort'),'Task',0,'a'),undefined);
 assert.equal(customPropertyIssue(field('effort'),'Document',2,'a')!==undefined,true);
 assert.deepEqual(changedCustomKeys({checked:false,effort:1},{checked:false,effort:0}),['effort']);
});
test('project schemas are bounded, isolated and never follow schema symlinks',async()=>{
 const root=await mkdtemp(join(tmpdir(),'prism-schema-'));
 try{
  const a=join(root,'a'),b=join(root,'b');await mkdir(a);await mkdir(b);
  const absent=await readProjectSchema(a);assert.equal(absent.state,'available');if(absent.state==='available')assert.equal(absent.configured,false);
  await writeFile(join(a,'schema.yaml'),JSON.stringify(definition));
  const configured=await readProjectSchema(a);assert.equal(configured.state,'available');if(configured.state==='available')assert.equal(configured.configured,true);
  assert.deepEqual(await readProjectSchema(b),absent);
  const directory=join(root,'folder');await mkdir(directory);await symlink(directory,join(b,'schema.yaml'),process.platform==='win32'?'junction':'dir');
  assert.equal((await readProjectSchema(b)).state,'error');
  await writeFile(join(a,'schema.yaml'),'x'.repeat(131073));assert.equal((await readProjectSchema(a)).state,'error');
 }finally{await rm(root,{recursive:true,force:true});}
});
test('custom writes validate exact schema and record revisions, preserve inactive and unknown metadata, and reject cross-project references',async()=>{
 const root=await mkdtemp(join(tmpdir(),'prism-schema-store-'));
 try{
  const a=join(root,'a'),b=join(root,'b'),store=await RecordStore.open(a),other=await RecordStore.open(b);
  await writeFile(join(a,'schema.yaml'),JSON.stringify(definition));
  const schema=await store.schema();assert.equal(schema.state,'available');if(schema.state!=='available')throw Error('Schema missing');
  const record=await store.create('Task','Task'),target=await store.create('Objective','Objective'),outside=await other.create('Other objective','Objective');
  const path=join(a,'records',record.id+'.md');
  await writeFile(path,(await readFile(path,'utf8')).replace(/^---\r?\n/,'---\nexternalMetadata: {keep: true}\n'));
  const loaded=await store.get(record.id),edit=editableRecord(loaded);
  await assert.rejects(store.update(loaded.id,loaded.revision,{...edit,customProperties:{effort:'bad'}},schema.revision),CustomPropertyError);
  await assert.rejects(store.update(loaded.id,loaded.revision,{...edit,customProperties:{effort:2}}),CustomPropertyError);
  await assert.rejects(store.update(loaded.id,loaded.revision,{...edit,customProperties:{objective:outside.id}},schema.revision),CustomPropertyError);
  await assert.rejects(store.update(loaded.id,loaded.revision,{...edit,customProperties:{objective:loaded.id}},schema.revision),CustomPropertyError);
  await assert.rejects(store.update(loaded.id,loaded.revision,{...edit,customProperties:{unconfigured:'x'}},schema.revision),CustomPropertyError);
  const saved=await store.update(loaded.id,loaded.revision,{...edit,customProperties:{effort:0,objective:target.id,checked:false}},schema.revision);
  assert.deepEqual(saved.customProperties,{effort:0,objective:target.id,checked:false});assert.deepEqual(saved.externalMetadata,{keep:true});
  await assert.rejects(store.update(saved.id,loaded.revision,{...edit,title:'Stale'},schema.revision),ConflictError);
  const copy=await store.duplicate(saved.id,saved.revision);assert.equal(copy.customProperties,undefined);
  await writeFile(join(a,'schema.yaml'),JSON.stringify({...definition,fields:definition.fields.filter(f=>f.id!=='effort')}));
  await assert.rejects(store.update(saved.id,saved.revision,{...editableRecord(saved),customProperties:{...saved.customProperties,checked:true}},schema.revision),CustomPropertyError);
  const oldClient=editableRecord(saved);delete oldClient.customProperties;
  const changed=await store.update(saved.id,saved.revision,{...oldClient,title:'Preserved'});
  assert.deepEqual(changed.customProperties,saved.customProperties);
  const newSchema=await store.schema();if(newSchema.state!=='available')throw Error('Schema missing');
  await assert.rejects(store.update(changed.id,changed.revision,{...editableRecord(changed),customProperties:{checked:true,objective:target.id}},newSchema.revision),CustomPropertyError);
  const cleared=await store.update(changed.id,changed.revision,{...editableRecord(changed),customProperties:{effort:0,checked:false}},newSchema.revision);assert.deepEqual(cleared.customProperties,{effort:0,checked:false});
  await writeFile(join(a,'schema.yaml'),'malformed: true');
  const final=await store.update(cleared.id,cleared.revision,{...editableRecord(cleared),body:'Still editable'});assert.deepEqual(final.customProperties,cleared.customProperties);
  await assert.rejects(store.update(final.id,final.revision,{...editableRecord(final),customProperties:{effort:0,checked:true}},newSchema.revision),CustomPropertyError);
 }finally{await rm(root,{recursive:true,force:true});}
});

test('schema administration is additive, preserves option and field IDs, and permits reversible retirement',()=>{
 const initial=projectPropertySchema.parse(definition);
 const transition=(fields:typeof initial.fields)=>schemaTransitionIssue(initial,{version:1,fields});
 assert.match(transition(initial.fields.slice(1))??'',/Cannot delete/);
 assert.match(transition(initial.fields.map(f=>f.id==='effort'?{id:f.id,label:f.label,kind:'text'}:f))??'',/immutable/);
 assert.match(transition(initial.fields.map(f=>f.id==='effort'?{...f,appliesTo:['Document']}:f))??'',/immutable/);
 assert.match(transition(initial.fields.map(f=>f.kind==='enum'?{...f,options:[{id:'new',label:'New'}]}:f))??'',/option IDs/);
 assert.equal(transition(initial.fields.map(f=>f.kind==='enum'?{...f,label:'Renamed',options:[...f.options,{id:'ready',label:'Ready'}]}:{...f,retired:true})),undefined);
 const retired={...initial.fields[0],retired:true};
 assert.ok(customPropertyIssue(retired,'Task',2,'a'));
});
test('revision-checked schema writes do not rewrite record bytes or overwrite stale definitions',async()=>{
 const root=await mkdtemp(join(tmpdir(),'prism-schema-admin-'));
 try{
  const store=await RecordStore.open(root),empty=await store.schema();
  if(empty.state!=='available')throw Error('Missing schema state');
  const a=await store.updateSchema(empty.revision,projectPropertySchema.parse(definition));
  if(a.state!=='available')throw Error('Missing saved schema');
  assert.equal(a.configured,true);
  await assert.rejects(store.updateSchema(empty.revision,{version:1,fields:[]}),SchemaWriteConflict);
  const record=await store.create('Example','Task');
  const saved=await store.update(record.id,record.revision,{...editableRecord(record),customProperties:{effort:4}},a.revision);
  const recordPath=join(root,'records',record.id+'.md'),bytes=await readFile(recordPath);
  await assert.rejects(store.updateSchema(a.revision,{version:1,fields:a.definition.fields.slice(1)}),SchemaWriteRejected);
  const retired=await store.updateSchema(a.revision,{version:1,fields:a.definition.fields.map(f=>f.id==='effort'?{...f,retired:true}:f)});
  if(retired.state!=='available')throw Error('No retired definition');
  assert.deepEqual(await readFile(recordPath),bytes);
  assert.equal((await store.get(record.id)).customProperties?.effort,4);
  await assert.rejects(store.update(saved.id,saved.revision,{...editableRecord(saved),customProperties:{effort:5}},retired.revision),CustomPropertyError);
  const restored=await store.updateSchema(retired.revision,{version:1,fields:retired.definition.fields.map(f=>f.id==='effort'?{...f,retired:false}:f)});
  if(restored.state!=='available')throw Error('No restored definition');
  assert.deepEqual(await readFile(recordPath),bytes);
  assert.equal((await store.update(saved.id,saved.revision,{...editableRecord(saved),customProperties:{effort:5}},restored.revision)).customProperties?.effort,5);
  await writeFile(join(root,'schema.yaml'),'invalid: true');
  await assert.rejects(store.updateSchema(restored.revision,restored.definition),SchemaWriteRejected);
  assert.equal(await readFile(join(root,'schema.yaml'),'utf8'),'invalid: true');
 }finally{await rm(root,{recursive:true,force:true});}
});

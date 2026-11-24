import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp,rm,writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join,resolve } from 'node:path';
import { ViewStore } from '../server/views';
import { RecordStore,ConflictError } from '../server/store';
import { defaultFilters,filtersSchema,selectRecords,sortBy,sortDirection,relationshipsFor } from '../shared/views';
test('saved view persistence, revision conflict, deletion and malformed file reporting',async()=>{
  const root=await mkdtemp(join(tmpdir(),'prism-view-'));
  try{
    const store=await ViewStore.open(root);
    const input={title:'Release review',mode:'Table' as const,filters:{...defaultFilters,status:'In progress' as const}};
    const view=await store.create(input);
    const reopened=await ViewStore.open(root);
    assert.equal((await reopened.list()).views[0].title,input.title);
    const changed=await reopened.update(view.id,view.revision,{...input,title:'New review'});
    await assert.rejects(reopened.update(view.id,view.revision,input),ConflictError);
    await assert.rejects(reopened.remove(view.id,view.revision),ConflictError);
    await reopened.remove(view.id,changed.revision);
    assert.equal((await reopened.list()).views.length,0);
    await writeFile(join(root,'views','bad.yaml'),'invalid');
    assert.equal((await reopened.list()).errors.length,1);
    await assert.rejects(reopened.get('../invalid'));
  }finally{await rm(root,{recursive:true,force:true});}
});
test('Emberfall view definitions and relationship projections',async()=>{
  const root=resolve('tests/fixtures/emberfall/.prism');
  const records=(await (await RecordStore.open(root)).list()).records;
  const views=await (await ViewStore.open(root)).list();
  assert.equal(views.errors.length,0);
  assert.equal(views.views.length,4);
  assert.deepEqual(selectRecords(records,{...defaultFilters,type:'Requirement'}).map(r=>r.id).sort(),['collect-requirement','return-requirement']);
  const links=relationshipsFor(records,'collect-requirement');
  assert.ok(links.incoming.some(r=>r.id==='core-loop'));
  assert.ok(links.outgoing.some(r=>r.record?.id==='collection-test'));
  const sorted=selectRecords(records,{...defaultFilters,priority:'High',sort:'Priority'});
  assert.ok(sorted.length>0&&sorted.every(r=>r.priority==='High'));
});

test('legacy priority sorts remain high first; direction and column toggles are deterministic',async()=>{
  const root=await mkdtemp(join(tmpdir(),'prism-sort-'));try{const store=await RecordStore.open(root);const a=await store.create('Alpha','Task'),b=await store.create('Beta','Task');const records=[{...a,priority:'Low' as const},{...b,priority:'High' as const}];const legacy=filtersSchema.parse({...defaultFilters,sort:'Priority'});assert.equal(sortDirection(legacy),'Descending');assert.deepEqual(selectRecords(records,legacy).map(r=>r.title),['Beta','Alpha']);const ascending=sortBy(legacy,'Priority');assert.equal(ascending.direction,'Ascending');assert.deepEqual(selectRecords(records,ascending).map(r=>r.title),['Alpha','Beta']);assert.deepEqual(selectRecords(records,{...defaultFilters,sort:'Title',direction:'Descending'}).map(r=>r.title),['Beta','Alpha']);assert.equal(filtersSchema.safeParse({...legacy,direction:'wrong'}).success,false);const views=await ViewStore.open(root);const saved=await views.create({title:'Ascending priority',mode:'Table',filters:ascending});assert.equal((await views.get(saved.id)).filters.direction,'Ascending');}finally{await rm(root,{recursive:true,force:true});}
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { collectionRoute,recordRoute,savedRoute,routeHash,parseRoute,parentDestination,contextFor,restoreCollection,checkedEntry,guardedTraversal,type HistoryEntry } from '../shared/routes';
import { destinationsFor,navigationFor,navigationForSaved } from '../shared/navigation';
import { recordSchema,type ProjectRecord } from '../shared/records';
import type { ProjectInfo } from '../shared/projects';
import type { SavedView } from '../shared/views';
const project:ProjectInfo={id:'prism',title:'Prism',storage:'repository',profiles:['core','product','project']};
const nav=destinationsFor(project);
const work=nav.find(d=>d.id==='work')!,library=nav.find(d=>d.id==='library')!,requirements=nav.find(d=>d.id==='requirements')!;
test('stable collection, record and saved-view routes round trip; malformed addresses are rejected',()=>{
  for(const route of [collectionRoute('prism'),collectionRoute('prism','work'),collectionRoute('prism','trash'),recordRoute('prism','draft-recovery'),savedRoute('prism','10-acceptance')])assert.deepEqual(parseRoute(routeHash(route)),route);
  for(const invalid of ['','#/projects/prism','#/projects/prism/records','#/projects/prism/records/a%2Fb','#/projects/prism/records/..','#/projects/%ZZ/work','#/projects/prism/saved/a/extra','#/projects/PRISM/work'])assert.equal(parseRoute(invalid),null);
});
test('record breadcrumbs derive the available category without changing record identity',()=>{
  const record:ProjectRecord={...recordSchema.parse({id:'one',title:'A task',type:'Task',status:'Concept',priority:'High',accent:'teal',tags:[],relationships:[],body:'Body'}),revision:'a'.repeat(64)};
  assert.equal(parentDestination(nav,record).id,'work');
  assert.equal(parentDestination(nav,{...record,type:'Test'}).id,'quality');
  assert.equal(parentDestination(nav,{...record,type:'Risk'}).id,'library');
  assert.equal(routeHash(recordRoute(project.id,record.id)),'#/projects/prism/records/one');
  assert.equal(parentDestination(destinationsFor({...project,profiles:['core']}),{...record,type:'Requirement'}).id,'library');
});
test('history restores validated view and filters independently of new preferences',()=>{
  const original=navigationFor(requirements,'Wiki');
  const context={...contextFor(original),filters:{...original.filters,search:'recovery',priority:'High' as const,direction:'Descending' as const},focus:'one',slide:2};
  const restored=restoreCollection(requirements,'Table',context);
  assert.equal(restored.view,'Wiki');assert.equal(restored.filters.search,'recovery');assert.equal(restored.filters.priority,'High');assert.equal(restored.filters.direction,'Descending');
  assert.equal(restoreCollection(requirements,'Table',{...context,mode:'Board'}).view,'Table');
  assert.equal(restoreCollection(requirements,'Table',{...context,filters:{...context.filters,type:'Task'}}).filters.type,'Requirement');
  assert.equal(restoreCollection(work,'Board',null).view,'Board');
});
test('saved views retain identity and explicit defaults while history restores edited presentation',()=>{
  const saved:SavedView={id:'10-acceptance',title:'Acceptance',version:1,mode:'Wiki',filters:{...navigationFor(library).filters,type:'Test'},revision:'a'.repeat(64)};
  const initial=restoreCollection(library,'Table',undefined,saved);
  assert.deepEqual(initial,navigationForSaved(saved));
  const restored=restoreCollection(library,'Table',{...contextFor(initial),mode:'Gallery'},saved);
  assert.equal(restored.view,'Gallery');assert.equal(restored.savedView?.id,saved.id);assert.equal(restored.filters.type,'Test');
});
test('history snapshots match the current URL and guarded traversal returns to the protected entry',()=>{
  const one:HistoryEntry={version:1,trail:'test-trail',index:1,hash:routeHash(collectionRoute('prism','work')),scroll:250,context:contextFor(navigationFor(work))};
  const two:HistoryEntry={...one,index:2,hash:routeHash(recordRoute('prism','draft-recovery')),scroll:0,context:undefined};
  assert.deepEqual(checkedEntry(one,one.hash),one);
  assert.equal(checkedEntry(one,two.hash),null);
  assert.equal(checkedEntry({...one,index:-1},one.hash),null);
  assert.deepEqual(guardedTraversal(two,one),{kind:'return',delta:1});
  assert.deepEqual(guardedTraversal(one,two),{kind:'return',delta:-1});
  assert.deepEqual(guardedTraversal(two,two),{kind:'same'});
  assert.deepEqual(guardedTraversal(two,null),{kind:'restore'});
  assert.deepEqual(guardedTraversal(two,{...one,trail:'other'}),{kind:'restore'});
});

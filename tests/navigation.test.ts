import { test } from 'node:test';
import assert from 'node:assert/strict';
import { destinationsFor,overviewFor,navigationFor,navigationForSaved,navigationMode,resetNavigationFilters,orderedModes,modeOrder,navigationGroups } from '../shared/navigation';
import { recordSchema,type ProjectRecord,type Editable } from '../shared/records';
import type { SavedView } from '../shared/views';
import type { ProjectInfo } from '../shared/projects';
const project:ProjectInfo={id:'test',title:'Test',profiles:['core','product','project'],storage:'repository'};
test('navigation is profile-aware and destination modes are contextual',()=>{
  const nav=destinationsFor(project);
  assert.equal(nav[0].id,'overview');
  assert.equal(nav.find(d=>d.id==='work')?.type,'Task');
  assert.deepEqual(nav.find(d=>d.id==='roadmap')?.modes,['Table','Board','Wiki','Plan','Timeline']);
  assert.ok(nav.some(d=>d.id==='requirements'));
  assert.ok(nav.some(d=>d.id==='repository'));
  assert.ok(!nav.some(d=>d.id==='gameplay'));
  const game=destinationsFor({...project,profiles:['core','game'],storage:'standalone'});
  assert.ok(game.some(d=>d.id==='assets'));
  assert.ok(!game.some(d=>d.id==='repository'||d.id==='strategy'));
  assert.ok(game.some(d=>d.id==='library'));
});
function rec(id:string,type:Editable['type'],status:Editable['status'],tags:string[]=[]):ProjectRecord{
  return {...recordSchema.parse({id,title:id,type,status,tags,relationships:[],priority:'High',accent:'teal',body:'Example'}),revision:'a'.repeat(64)};
}
test('overview derives actual status and open blocker tags without claiming completion evidence',()=>{
  const result=overviewFor([rec('objective','Objective','Concept'),rec('m0','Milestone','In progress'),rec('m1','Milestone','Concept'),rec('a','Task','In progress',['blocker']),rec('b','Task','Ready',['blocker']),rec('c','Task','Concept',['blocker']),rec('d','Task','Concept',['not-a-blocker'])]);
  assert.deepEqual(result.activeMilestones.map(r=>r.id),['m0']);
  assert.deepEqual(result.activeTasks.map(r=>r.id),['a']);
  assert.deepEqual(result.blockers.map(r=>r.id),['a','c']);
  assert.equal(result.readyTasks,1);
  assert.equal(result.totalTasks,4);
  assert.equal(overviewFor([]).totalTasks,0);
});

test('navigation changes destination, view and filters together without an intermediate table state',()=>{
  const nav=destinationsFor(project);
  const work=nav.find(d=>d.id==='work')!,requirements=nav.find(d=>d.id==='requirements')!,docs=nav.find(d=>d.id==='documentation')!;
  const before=navigationFor(work);
  assert.equal(before.view,'Table');assert.equal(before.filters.type,'Task');
  const next=navigationFor(requirements);
  assert.equal(next.destinationId,'requirements');assert.equal(next.view,'Relationships');assert.equal(next.filters.type,'Requirement');
  assert.deepEqual(orderedModes(requirements),['Table','Wiki','Relationships','Traceability']);
  assert.equal(navigationMode(next,requirements,'Board'),next);
  assert.equal(navigationMode(next,requirements,'Table').view,'Table');
  assert.equal(navigationFor(docs).view,'Wiki');
  assert.equal(navigationFor(docs).filters.type,'Document');
  const saved:SavedView={id:'custom',title:'Custom',version:1,mode:'Gallery',filters:{...before.filters,type:'Asset',search:'example'},revision:'a'.repeat(64)};
  const opened=navigationForSaved(saved);
  assert.equal(opened.destinationId,'library');assert.equal(opened.view,'Gallery');assert.equal(opened.filters.type,'Asset');
  const reset=resetNavigationFilters(opened,nav.find(d=>d.id==='library')!);
  assert.equal(reset.savedView,null);assert.equal(reset.filters.type,'All records');assert.equal(reset.filters.search,'');
  assert.equal(reset.view,'Gallery');
});

test('all contextual toolbars retain a canonical relative order independent of default',()=>{
  const projects=[project,{...project,profiles:['core','game'] as ProjectInfo['profiles']}, {...project,storage:'standalone' as const}];
  for(const p of projects)for(const d of destinationsFor(p)){
    assert.ok(navigationGroups.includes(d.group));
    const ordered=orderedModes(d);
    assert.deepEqual(ordered,modeOrder.filter(mode=>d.modes.includes(mode)));
    assert.deepEqual(new Set(ordered),new Set(d.modes));
    assert.ok(ordered.includes(d.mode));
  }
  const nav=destinationsFor(project);
  const requirements=nav.find(d=>d.id==='requirements')!;
  assert.equal(navigationFor(requirements).view,'Relationships');
  assert.equal(navigationFor(requirements,'Wiki').view,'Wiki');
  assert.equal(navigationFor(requirements,'Board').view,'Relationships');
  assert.equal(navigationFor(requirements,'unknown').view,'Relationships');
});

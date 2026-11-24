import { test } from 'node:test';
import assert from 'node:assert/strict';
import { destinationsFor,overviewFor } from '../shared/navigation';
import { recordSchema,type ProjectRecord,type Editable } from '../shared/records';
import type { ProjectInfo } from '../shared/projects';
const project:ProjectInfo={id:'test',title:'Test',profiles:['core','product','project'],storage:'repository'};
test('navigation is profile-aware and destination modes are contextual',()=>{
  const nav=destinationsFor(project);
  assert.equal(nav[0].id,'overview');
  assert.equal(nav.find(d=>d.id==='work')?.type,'Task');
  assert.deepEqual(nav.find(d=>d.id==='roadmap')?.modes,['Table','Board','Wiki']);
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

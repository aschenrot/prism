import {test} from 'node:test';
import assert from 'node:assert/strict';
import {timelineProjection,timelinePosition,timelineConfigSchema,dayLabel} from '../shared/timeline';
import {projectPropertySchema} from '../shared/customProperties';
import {recordSchema,type ProjectRecord} from '../shared/records';
const schema=projectPropertySchema.parse({version:1,fields:[{id:'start',label:'Start',kind:'date',appliesTo:['Task']},{id:'end',label:'End',kind:'date',appliesTo:['Task']}]});
const rec=(id:string,start?:string,end?:string):ProjectRecord=>({...recordSchema.parse({id,title:id,type:'Task',status:'Concept',priority:'Normal',accent:'teal',tags:[],relationships:[],body:'',customProperties:{...(start?{start}:{}),...(end?{end}:{})}}),revision:'a'.repeat(64)});
test('timeline uses authored inclusive UTC calendar ranges; rejects incomplete, reversed and invalid values',()=>{
 const records=[rec('a','2026-12-01','2026-12-03'),rec('b','2026-12-04','2026-12-04'),rec('c','2026-12-05'),rec('d','2026-12-05','2026-12-01'),rec('e','2026-02-30','2026-12-01')];
 const p=timelineProjection(records,schema,{start:'start',end:'end'});assert.deepEqual(p.scheduled.map(x=>x.record.id),['a','b']);assert.equal(p.unscheduled.length,3);assert.ok(p.range);assert.equal(dayLabel(p.range.min),'2026-12-01');assert.equal(dayLabel(p.range.max),'2026-12-04');assert.deepEqual(timelinePosition(p.range,p.scheduled[0]),{left:0,width:75});assert.deepEqual(timelinePosition(p.range,p.scheduled[1]),{left:75,width:25});
 assert.equal(timelineProjection([records[2]],schema,{start:'start'}).scheduled.length,1);assert.ok(timelineProjection(records,{...schema,fields:schema.fields.map(f=>({...f,retired:true}))},{start:'start'}).issue);assert.equal(timelineConfigSchema.safeParse({start:'start',end:'start'}).success,false);
});

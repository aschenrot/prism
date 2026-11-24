import { z } from 'zod';
import { schemaId,appliesTo,entityTypeIssue,type ProjectPropertySchema } from './customProperties';
import type { ProjectRecord } from './records';
export const timelineConfigSchema=z.strictObject({start:schemaId,end:schemaId.optional()}).refine(v=>!v.end||v.end!==v.start,'Choose distinct start and end fields');
export type TimelineConfig=z.infer<typeof timelineConfigSchema>;
type Scheduled={record:ProjectRecord;start:string;end?:string;startDay:number;endDay:number};
type Unscheduled={record:ProjectRecord;reason:string};
const DAY=86400000;
export function dateFields(schema:ProjectPropertySchema|undefined){return (schema?.fields??[]).filter(f=>f.kind==='date'&&!f.retired);}
export function timelineProjection(records:ProjectRecord[],schema:ProjectPropertySchema|undefined,config:TimelineConfig|undefined){
 const scheduled:Scheduled[]=[],unscheduled:Unscheduled[]=[];
 const start= dateFields(schema).find(f=>f.id===config?.start),end=config?.end?dateFields(schema).find(f=>f.id===config.end):undefined;
 if(!config||!start||config.end&&!end)return {scheduled,unscheduled,range:undefined,issue:!config?'Choose an authored date field.':'A selected date field is unavailable or retired. Review the mapping.'};
 let min=Infinity,max=-Infinity;
 for(const record of records){
  const entity=schema&&!entityTypeIssue(schema,record.type,record.customTypeId,false)?record.customTypeId:undefined;
  const a=record.customProperties?.[start.id],b=end?record.customProperties?.[end.id]:undefined;
  const issue=!appliesTo(start,record.type,entity)||end&&!appliesTo(end,record.type,entity)?'Date field does not apply to this record':a===undefined||end&&b===undefined?'Required timeline date is not set':!z.iso.date().safeParse(a).success||end&&!z.iso.date().safeParse(b).success?'Invalid stored date':undefined;
  if(issue){unscheduled.push({record,reason:issue});continue;}
  const startText=a as string,endText=end?b as string:undefined,startDay=Date.parse(startText+'T00:00:00Z')/DAY,endDay=endText?Date.parse(endText+'T00:00:00Z')/DAY:startDay;
  if(!Number.isFinite(startDay)||!Number.isFinite(endDay)||endDay<startDay){unscheduled.push({record,reason:'End precedes start or date is invalid'});continue;}
  scheduled.push({record,start:startText,end:endText,startDay,endDay});min=Math.min(min,startDay);max=Math.max(max,endDay);
 }
 return {scheduled,unscheduled,range:scheduled.length?{min,max}:undefined,issue:undefined};
}
export function dayLabel(day:number){return new Date(day*DAY).toISOString().slice(0,10);}
export function timelinePosition(range:{min:number;max:number},item:Pick<Scheduled,'startDay'|'endDay'>){
 const span=range.max-range.min+1;return {left:(item.startDay-range.min)/span*100,width:(item.endDay-item.startDay+1)/span*100};
}

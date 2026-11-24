import { z } from 'zod';
import { schemaId,customPropertyIssue,type ProjectPropertySchema } from './customProperties';
import type { ProjectRecord } from './records';
import type { Filters } from './views';
const builtins=[
 {id:'type',label:'Type',width:116,sort:'Type'},
 {id:'status',label:'Status',width:148,sort:'Status'},
 {id:'priority',label:'Priority',width:118,sort:'Priority'},
 {id:'delivery',label:'Delivery',width:160},
 {id:'created',label:'Created',width:180,sort:'Created'},
 {id:'edited',label:'Last edited',width:180,sort:'Last edited'},
 {id:'id',label:'ID',width:180,sort:'ID'},
 {id:'tags',label:'Tags',width:180}
] as const;
export const maxTableColumns=12;
export const tableColumnsSchema=z.array(z.string().refine(id=>builtins.some(c=>c.id===id)||(id.startsWith('property:')&&schemaId.safeParse(id.slice(9)).success),'Unknown column ID')).max(maxTableColumns).refine(ids=>new Set(ids).size===ids.length,'Duplicate columns');
export type Column={id:string;label:string;width:number;sort?:Filters['sort']};
export function defaultTableColumns(delivery=false):string[]{return ['type','status','priority',...(delivery?['delivery']:[])];}
export function columnFor(id:string,schema?:ProjectPropertySchema):Column{
 const builtin=builtins.find(c=>c.id===id);if(builtin)return builtin;
 const key=id.slice(9),field=schema?.fields.find(f=>f.id===key);
 return {id,label:field?field.label+(field.retired?' (retired)':''):'Property: '+key+' (unavailable)',width:180};
}
export function availableColumns(schema?:ProjectPropertySchema):Column[]{return [...builtins,...(schema?.fields??[]).filter(f=>!f.retired).map(f=>columnFor('property:'+f.id,schema))];}
export function tableMinWidth(columns:Column[]){return 338+columns.reduce((sum,c)=>sum+c.width,0);}
export function propertyColumnValue(record:ProjectRecord,id:string,schema:ProjectPropertySchema|undefined,records:ReadonlyMap<string,ProjectRecord>):string{
 const key=id.slice(9);const value=record.customProperties?.[key];if(value===undefined)return '—';
 const field=schema?.fields.find(f=>f.id===key),raw=typeof value==='boolean'?(value?'Yes':'No'):String(value);
 if(!field||field.retired)return raw+' (preserved)';
 const target=typeof value==='string'?records.get(value):undefined;
 const issue=customPropertyIssue(field,record.type,value,record.id,target,record.customTypeId);
 if(issue)return raw+' (inactive or invalid)';
 if(field.kind==='enum')return field.options.find(o=>o.id===value)?.label??raw;
 if(field.kind==='reference')return target?.title??raw;
 return raw;
}

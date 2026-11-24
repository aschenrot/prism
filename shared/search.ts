import { z } from 'zod';
import { entityTypeLabel,customPropertyIssue,type ProjectPropertySchema } from './customProperties';
import type { ProjectRecord } from './records';
import type { RepositoryFile } from './projects';
export const searchInputSchema=z.strictObject({query:z.string().trim().min(1).max(300)});
export const searchResultLimit=100;
export type RecordHit={id:string;title:string;typeLabel:string;matches:{field:string;excerpt:string}[];score:number};
export type FileHit={path:string;kind:RepositoryFile['kind'];matches:{field:string;excerpt:string}[];previewAvailable:boolean;score:number};
export type ProjectSearchResult={query:string;records:RecordHit[];files:FileHit[];recordMatches:number;fileMatches:number;recordErrors:number;schemaAvailable:boolean;repository:{state:'unavailable'}|{state:'searched';indexed:number;scanned:number;unread:number;truncated:boolean}};
const normalize=(text:string)=>text.normalize('NFKC').toLowerCase();
export function searchTerms(query:string){return [...new Set(normalize(query).trim().split(/\s+/).filter(Boolean))];}
type Field={field:string;text:string;weight:number};
function excerpt(text:string,term:string){const index=normalize(text).indexOf(term);const start=Math.max(0,index-45),end=Math.min(text.length,start+180);return (start?'…':'')+text.slice(start,end).replace(/\s+/g,' ')+(end<text.length?'…':'');}
export function matchFields(fields:Field[],terms:string[]){
 if(!terms.length)return undefined;
 const matched=new Set<string>();let score=0;const evidence:{field:string;excerpt:string;weight:number}[]=[];
 for(const f of fields){const normalized=normalize(f.text),found=terms.filter(t=>normalized.includes(t));if(!found.length)continue;
  found.forEach(t=>matched.add(t));score+=f.weight*found.length;evidence.push({field:f.field,excerpt:excerpt(f.text,found[0]),weight:f.weight});
 }
 if(matched.size!==terms.length)return undefined;
 return {score,matches:evidence.sort((a,b)=>b.weight-a.weight).slice(0,5).map(({field,excerpt})=>({field,excerpt}))};
}
export function searchRecords(records:ProjectRecord[],schema:ProjectPropertySchema|undefined,terms:string[]){
 const byId=new Map(records.map(r=>[r.id,r]));
 const hits:RecordHit[]=[];
 for(const r of records){
  const label=entityTypeLabel(schema,r.customTypeId,r.type);
  const fields:Field[]=[{field:'Title',text:r.title,weight:10},{field:'ID',text:r.id,weight:8},{field:'Type',text:label+' '+(r.customTypeId??''),weight:5},{field:'Tags',text:r.tags.join(' '),weight:5},{field:'Status and priority',text:r.status+' '+r.priority,weight:2},{field:'Body',text:r.body,weight:1}];
  for(const [id,value] of Object.entries(r.customProperties??{})){
   const def=schema?.fields.find(f=>f.id===id),target=typeof value==='string'?byId.get(value):undefined;
   const valid=!!def&&!customPropertyIssue(def,r.type,value,r.id,target,r.customTypeId);
   const display=valid&&def.kind==='enum'?def.options.find(o=>o.id===value)?.label:valid&&def.kind==='reference'?target?.title:valid&&def.kind==='boolean'?(value?'Yes':'No'):undefined;
   fields.push({field:(def?.label??id)+(valid?'':' (preserved)'),text:(def?.label??id)+' '+id+' '+String(value)+(display?' '+display:''),weight:3});
  }
  const hit=matchFields(fields,terms);if(hit)hits.push({id:r.id,title:r.title,typeLabel:label,...hit});
 }
 hits.sort((a,b)=>b.score-a.score||a.title.localeCompare(b.title)||a.id.localeCompare(b.id));
 return {total:hits.length,hits:hits.slice(0,searchResultLimit)};
}

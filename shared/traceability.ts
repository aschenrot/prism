import type { ProjectRecord } from './records';
import { distinctRelationships,normalizeRelationship,relationshipIssue } from './relationships';
export type TraceRow={record:ProjectRecord;implementation:ProjectRecord[];tests:ProjectRecord[];documents:ProjectRecord[];invalid:{source:ProjectRecord;kind:string;issue:string}[]};
export function traceabilityFor(records:ProjectRecord[],visible:ProjectRecord[]=records){
 const rows=new Map<string,TraceRow>();
 for(const record of visible)if(record.type==='Requirement'||record.type==='Feature')rows.set(record.id,{record,implementation:[],tests:[],documents:[],invalid:[]});
 for(const source of records)for(const raw of distinctRelationships(source.relationships)){
  const {kind,target}=normalizeRelationship(raw);
  if(kind!=='implements'&&kind!=='verifies'&&kind!=='documents')continue;
  const row=rows.get(target);if(!row)continue;
  const issue=target===source.id?'Self-reference':relationshipIssue(kind,source.type,row.record.type);
  if(issue){row.invalid.push({source,kind,issue});continue;}
  row[kind==='implements'?'implementation':kind==='verifies'?'tests':'documents'].push(source);
 }
 const order=(a:ProjectRecord,b:ProjectRecord)=>a.title.localeCompare(b.title)||a.id.localeCompare(b.id);
 for(const row of rows.values()){row.implementation.sort(order);row.tests.sort(order);row.documents.sort(order);row.invalid.sort((a,b)=>order(a.source,b.source)||a.kind.localeCompare(b.kind));}
 const result=[...rows.values()];
 return {rows:result,missingImplementation:result.filter(r=>!r.implementation.length).length,missingTests:result.filter(r=>!r.tests.length).length,invalid:result.reduce((sum,r)=>sum+r.invalid.length,0)};
}

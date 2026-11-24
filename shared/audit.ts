import type { ProjectRecord } from './records';
import { normalizeRelationship,relationshipKey,relationshipIssue } from './relationships';
export type Finding = { id:string; title:string; detail:string; recordId:string };
export function auditRecords(records:ProjectRecord[]):Finding[]{
  const known=new Map(records.map(r=>[r.id,r]));
  const findings:Finding[]=[];
  for(const r of records){
    const seen=new Set<string>();
    for(const link of r.relationships){
      const {kind,target}=normalizeRelationship(link);
      const key=relationshipKey(link),destination=known.get(target);
      if(seen.has(key))continue;
      seen.add(key);
      const id=r.id+':'+key;
      if(target===r.id||!destination) {
        findings.push({id,title:target===r.id?'Self-reference':'Unresolved record link',detail:r.title+' → '+target,recordId:r.id});
        continue;
      }
      const issue=relationshipIssue(kind,r.type,destination.type);
      if(issue)findings.push({id,title:'Invalid relationship endpoints',detail:r.title+' → '+destination.title+'. '+issue,recordId:r.id});
    }
    if(!r.body.trim())findings.push({id:r.id+':empty',title:'Missing description',detail:r.title,recordId:r.id});
  }
  return findings;
}

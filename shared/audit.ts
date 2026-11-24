import type { ProjectRecord } from './records';
export type Finding = { id:string; title:string; detail:string; recordId:string };
export function auditRecords(records:ProjectRecord[]):Finding[]{
  const known=new Set(records.map(r=>r.id));
  const findings:Finding[]=[];
  for(const r of records){
    for(const target of new Set(r.relationships)){
      if(target===r.id||!known.has(target))findings.push({id:r.id+':'+target,title:target===r.id?'Self-reference':'Unresolved record link',detail:r.title+' → '+target,recordId:r.id});
    }
    if(!r.body.trim())findings.push({id:r.id+':empty',title:'Missing description',detail:r.title,recordId:r.id});
  }
  return findings;
}

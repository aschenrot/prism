import type { ProjectRecord } from './records';
export type CommitEvidence={sha:string;date:string;subject:string;recordIds:string[];invalidReferences:string[]};
export type GitHistory=
  | {state:'available';head:string;commits:CommitEvidence[];truncated:boolean;shallow:boolean;observedAt:string}
  | {state:'unavailable'|'error';message:string;observedAt:string};
export type AvailableHistory=Extract<GitHistory,{state:'available'}>;
export function linkedCommits(record:ProjectRecord,history:GitHistory|undefined):CommitEvidence[]{
  if(history?.state!=='available')return [];
  const explicit=new Set(record.implementationCommits||[]);
  return history.commits.filter(c=>c.recordIds.includes(record.id)||explicit.has(c.sha));
}
export function reconcileHistory(records:ProjectRecord[],history:AvailableHistory){
  const known=new Set(records.map(r=>r.id));
  const historical=new Set(records.flatMap(r=>r.implementationCommits||[]));
  const unresolved=history.commits.flatMap(c=>c.recordIds.filter(id=>!known.has(id)).map(id=>({sha:c.sha,id})));
  const unlinked=history.commits.filter(c=>!c.recordIds.length&&!c.invalidReferences.length&&!historical.has(c.sha));
  const invalid=history.commits.flatMap(c=>c.invalidReferences.map(value=>({sha:c.sha,value})));
  const pending=records.filter(r=>r.type==='Task'&&r.status!=='Ready'&&linkedCommits(r,history).length>0);
  return {unresolved,unlinked,invalid,pending};
}
export function deliveryLabel(record:ProjectRecord,history:GitHistory|undefined){
  if(history?.state!=='available')return undefined;
  const commits=linkedCommits(record,history);
  return commits.length?{label:'Linked change',count:commits.length,latest:commits[0]}:undefined;
}

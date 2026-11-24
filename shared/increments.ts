import type { ProjectRecord } from './records';
import { distinctRelationships,normalizeRelationship,relationshipIssue } from './relationships';
import { acceptanceDefinition,currentAcceptance,type AcceptanceList } from './acceptance';
import { linkedCommits,type GitHistory } from './delivery';
export function scopeFor(increment:ProjectRecord,records:ProjectRecord[],history?:GitHistory){
 const byId=new Map(records.map(r=>[r.id,r])),tasks:ProjectRecord[]=[],tests:ProjectRecord[]=[],issues:{id:string;message:string}[]=[];
 if(increment.type==='Increment')for(const link of distinctRelationships(increment.relationships).map(normalizeRelationship)){
  if(link.kind!=='contains')continue;
  const target=byId.get(link.target);
  if(!target){issues.push({id:link.target,message:'Missing scope member'});continue;}
  const issue=relationshipIssue('contains',increment.type,target.type);
  if(issue){issues.push({id:link.target,message:issue});continue;}
  if(target.type==='Task')tasks.push(target);else if(target.type==='Test')tests.push(target);
 }
 const milestones=records.filter(r=>r.type==='Milestone'&&r.relationships.map(normalizeRelationship).some(edge=>edge.kind==='contains'&&edge.target===increment.id));
 return {tasks,tests,issues,milestones,ready:tasks.filter(r=>r.status==='Ready').length,linked:tasks.filter(r=>linkedCommits(r,history).length>0).length};
}
export function milestoneIncrements(milestone:ProjectRecord,records:ProjectRecord[]){
 if(milestone.type!=='Milestone')return [];
 const ids=new Set(milestone.relationships.map(normalizeRelationship).filter(link=>link.kind==='contains').map(link=>link.target));
 return records.filter(record=>record.type==='Increment'&&ids.has(record.id));
}
export function scopeReview(test:ProjectRecord,head:string|undefined,list:AcceptanceList|undefined){
 if(acceptanceDefinition(test).state!=='available')return {state:'unsupported' as const,message:'No executable acceptance definition'};
 if(!head)return {state:'unknown' as const,message:'Current revision unavailable'};
 if(!list)return {state:'unknown' as const,message:'Review history unavailable'};
 if(list.errors.length)return {state:'unknown' as const,message:'Review history incomplete'};
 const current=list.runs.filter(run=>run.testId===test.id&&currentAcceptance(run,head,test.revision)).sort((a,b)=>b.startedAt.localeCompare(a.startedAt)||b.updatedAt.localeCompare(a.updatedAt)||b.id.localeCompare(a.id))[0];
 if(!current)return {state:list.runs.length?'historical' as const:'pending' as const,message:list.runs.length?'Historical review — no current run':'No review recorded'};
 const p=current.progress;
 const counts=p.passed+' / '+p.total+' cases passed';
 if(current.decision==='accepted'&&p.total>0&&p.passed===p.total&&!p.pending&&!p.failed&&!p.blocked)return {state:'accepted' as const,message:counts+' · Accepted'};
 if(current.decision==='changes-requested')return {state:'changes-requested' as const,message:counts+' · Changes requested'};
 if(current.decision==='accepted')return {state:'unknown' as const,message:'Inconsistent accepted result'};
 return {state:'pending' as const,message:counts+' · '+(p.passed===p.total?'Decision pending':'Review open')};
}

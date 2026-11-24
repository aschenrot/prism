import type { ProjectRecord } from './records';
import { normalizeRelationship } from './relationships';
export type DependencyLink={id:string;record?:ProjectRecord;assertions:('depends-on'|'blocks')[]};
export type DependencyRow={record:ProjectRecord;prerequisites:DependencyLink[];dependents:DependencyLink[];cycle:boolean;state:'cycle'|'unresolved'|'waiting'|'satisfied'|'none'};
type Edge={prerequisite:string;dependent:string;assertions:Set<'depends-on'|'blocks'>};
// Edges always point prerequisite → dependent. Reciprocal authored assertions
// are distinct evidence of the same edge, not duplicate dependencies.
export function dependencyPlan(records:ProjectRecord[]):Map<string,DependencyRow>{
 const known=new Map(records.map(r=>[r.id,r])),edges=new Map<string,Edge>();
 for(const record of records)for(const raw of record.relationships){
  const {kind,target}=normalizeRelationship(raw);if(kind!=='depends-on'&&kind!=='blocks')continue;
  const prerequisite=kind==='depends-on'?target:record.id,dependent=kind==='depends-on'?record.id:target,key=prerequisite+':'+dependent;
  let edge=edges.get(key);if(!edge){edge={prerequisite,dependent,assertions:new Set()};edges.set(key,edge);}edge.assertions.add(kind);
 }
 const rows=new Map<string,DependencyRow>(),out=new Map<string,string[]>(),incoming=new Map<string,string[]>();
 for(const record of records){rows.set(record.id,{record,prerequisites:[],dependents:[],cycle:false,state:'none'});out.set(record.id,[]);incoming.set(record.id,[]);}
 for(const {prerequisite,dependent,assertions} of edges.values()){
  const evidence=[...assertions].sort();
  rows.get(dependent)?.prerequisites.push({id:prerequisite,record:known.get(prerequisite),assertions:evidence});
  rows.get(prerequisite)?.dependents.push({id:dependent,record:known.get(dependent),assertions:evidence});
  if(known.has(prerequisite)&&known.has(dependent)){out.get(prerequisite)!.push(dependent);incoming.get(dependent)!.push(prerequisite);}
 }
 // Iterative Kosaraju: exact strongly connected components, no recursion depth
 // limit and no false cycle label on downstream nodes.
 const visited=new Set<string>(),finished:string[]=[];
 for(const id of known.keys()){
  if(visited.has(id))continue;visited.add(id);const stack:[string,number][]=[[id,0]];
  while(stack.length){const top=stack[stack.length-1],next=out.get(top[0])!;if(top[1]<next.length){const neighbor=next[top[1]++];if(!visited.has(neighbor)){visited.add(neighbor);stack.push([neighbor,0]);}}else{finished.push(top[0]);stack.pop();}}
 }
 visited.clear();
 for(let i=finished.length-1;i>=0;i--){
  const root=finished[i];if(visited.has(root))continue;const stack=[root],component:string[]=[];visited.add(root);
  while(stack.length){const id=stack.pop()!;component.push(id);for(const neighbor of incoming.get(id)!)if(!visited.has(neighbor)){visited.add(neighbor);stack.push(neighbor);}}
  if(component.length>1||out.get(root)!.includes(root))for(const id of component)rows.get(id)!.cycle=true;
 }
 const order=(a:DependencyLink,b:DependencyLink)=>(a.record?.title??a.id).localeCompare(b.record?.title??b.id)||a.id.localeCompare(b.id);
 for(const row of rows.values()){
  row.prerequisites.sort(order);row.dependents.sort(order);
  row.state=row.cycle?'cycle':row.prerequisites.some(l=>!l.record)?'unresolved':row.prerequisites.some(l=>l.record?.status!=='Ready')?'waiting':row.prerequisites.length?'satisfied':'none';
 }
 return rows;
}

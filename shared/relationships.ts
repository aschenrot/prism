import type { ProjectRecord,Relationship,RelationshipKind,Editable } from './records';
export const relationshipLabels:Record<RelationshipKind,{outgoing:string;incoming:string}>={
  'related-to':{outgoing:'Related to',incoming:'Related from'},
  'implements':{outgoing:'Implements',incoming:'Implemented by'},
  'verifies':{outgoing:'Verifies',incoming:'Verified by'},
  'depends-on':{outgoing:'Depends on',incoming:'Required by'},
  'blocks':{outgoing:'Blocks',incoming:'Blocked by'},
  'documents':{outgoing:'Documents',incoming:'Documented by'}
};
export function normalizeRelationship(link:Relationship):{kind:RelationshipKind;target:string}{
  return typeof link==='string'?{kind:'related-to',target:link}:link;
}
export function relationshipKey(link:Relationship){const edge=normalizeRelationship(link);return edge.kind+':'+edge.target;}
export function distinctRelationships(links:Relationship[]){
  const seen=new Set<string>();
  return links.filter(link=>{const key=relationshipKey(link);if(seen.has(key))return false;seen.add(key);return true;});
}
// A deliberately small built-in vocabulary. Generic links do not assert semantics.
// Constraints apply to known endpoints; missing targets are separately audited.
export function relationshipIssue(kind:RelationshipKind,source:Editable['type'],target:Editable['type']):string|undefined{
  if(kind==='implements'&&(!['Feature','System','Task','Mechanic'].includes(source)||!['Requirement','Feature'].includes(target)))return 'Implements requires a feature, system, task or mechanic pointing to a requirement or feature.';
  if(kind==='verifies'&&(source!=='Test'||!['Requirement','Feature'].includes(target)))return 'Verifies requires a test pointing to a requirement or feature.';
  if(kind==='documents'&&source!=='Document')return 'Documents requires a document as its source.';
}
export function relationshipsFor(records:ProjectRecord[],id:string){
  const byId=new Map(records.map(r=>[r.id,r]));
  const record=byId.get(id);
  const outgoing=distinctRelationships(record?.relationships||[]).map(link=>{
    const {kind,target}=normalizeRelationship(link);
    return {id:target,kind,key:relationshipKey(link),record:byId.get(target)};
  });
  const incoming=records.filter(r=>r.id!==id).flatMap(r=>distinctRelationships(r.relationships)
    .map(normalizeRelationship).filter(edge=>edge.target===id)
    .map(edge=>({id:r.id,kind:edge.kind,key:r.id+':'+edge.kind,record:r})));
  return {outgoing,incoming};
}

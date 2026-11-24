import { useState } from 'react';
import { X } from 'lucide-react';
import { relationshipKinds,type RelationshipKind,type Relationship,type ProjectRecord,type Editable } from '../shared/records';
import { normalizeRelationship,relationshipKey,relationshipLabels,relationshipIssue } from '../shared/relationships';
export default function RelationshipEditor({sourceId,sourceType,links,records,onChange}:{sourceId:string;sourceType:Editable['type'];links:Relationship[];records:ProjectRecord[];onChange:(links:Relationship[])=>void}){
  const [kind,setKind]=useState<RelationshipKind>('related-to');
  const [target,setTarget]=useState('');
  const byId=new Map(records.map(r=>[r.id,r]));
  const candidates=records.filter(r=>r.id!==sourceId&&!relationshipIssue(kind,sourceType,r.type)&&!links.some(link=>relationshipKey(link)===kind+':'+r.id));
  const canAdd=candidates.some(r=>r.id===target)&&links.length<200;
  return <div className="relationship-editor">
    <div className="eyebrow">RELATIONSHIPS</div>
    <label>Relationship type<select value={kind} onChange={e=>{setKind(e.target.value as RelationshipKind);setTarget('');}}>{relationshipKinds.map(k=><option key={k} value={k}>{relationshipLabels[k].outgoing}</option>)}</select></label>
    <label>Target record<select value={canAdd?target:''} onChange={e=>setTarget(e.target.value)}><option value="">Choose a compatible record…</option>{candidates.map(r=><option key={r.id} value={r.id}>{r.title} ({r.type})</option>)}</select></label>
    <button className="secondary" type="button" disabled={!canAdd} onClick={()=>{if(canAdd){onChange([...links,{kind,target}]);setTarget('');}}}>Add relationship</button>
    {!candidates.length&&<p className="link-empty">No compatible unlinked records for this relationship.</p>}
    <div className="draft-links">{links.map((link,i)=>{
      const edge=normalizeRelationship(link),destination=byId.get(edge.target);
      const warning=edge.target===sourceId?'Self-reference':!destination?'Unresolved target':relationshipIssue(edge.kind,sourceType,destination.type);
      return <div className="draft-link" key={relationshipKey(link)+'-'+i}><span>{destination?.title||edge.target}<small>{relationshipLabels[edge.kind].outgoing}{typeof link==='string'?' · legacy link':''}</small>{warning&&<small className="relationship-warning">{warning}</small>}</span><button type="button" className="icon-button" aria-label={'Remove '+relationshipLabels[edge.kind].outgoing+' '+edge.target} onClick={()=>onChange(links.filter((_,j)=>j!==i))}><X size={13}/></button></div>;
    })}</div>
    {!links.length&&<p className="link-empty">No outgoing relationships.</p>}
    <p className="link-empty">Existing generic links are preserved. Add an explicit type only when the relationship is known.</p>
  </div>;
}

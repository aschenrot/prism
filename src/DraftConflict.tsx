import { useState } from 'react';
import { compareDraft,reconcileDraft,type EditorDraft,type EditableField,type ConflictChoices } from '../shared/editor';
import type { ProjectRecord } from '../shared/records';
const labels:Record<EditableField,string>={title:'Title',type:'Type',status:'Status',priority:'Priority',accent:'Accent',tags:'Tags',relationships:'Relationships',body:'Notes',customProperties:'Custom properties',customTypeId:'Custom entity type'};
function display(value:unknown){return typeof value==='string'?value||'(empty)':JSON.stringify(value,null,2);}
export default function DraftConflict({session,record,onResolve,disabled}:{session:EditorDraft;record:ProjectRecord;onResolve:(next:EditorDraft)=>void;disabled:boolean}){
  const [choices,setChoices]=useState<ConflictChoices>({});
  const {disk,conflicts}=compareDraft(session,record);
  const resolved=reconcileDraft(session,record,choices);
  return <section className="draft-conflict" aria-label="Review external changes"><h3>Record changed on disk</h3><p>Your draft is intact. Changes to different fields can be combined. For fields changed in both versions, choose which value to keep before saving.</p>
    {conflicts.map(key=><fieldset className="conflict-field" disabled={disabled} key={key}><legend>{labels[key]}</legend>
      <label className="conflict-choice"><input type="radio" name={'conflict-'+key} checked={choices[key]==='disk'} onChange={()=>setChoices(c=>({...c,[key]:'disk'}))}/><span>Current disk value</span><pre>{display(disk[key])}</pre></label>
      <label className="conflict-choice"><input type="radio" name={'conflict-'+key} checked={choices[key]==='local'} onChange={()=>setChoices(c=>({...c,[key]:'local'}))}/><span>My draft value</span><pre>{display(session.draft[key])}</pre></label>
    </fieldset>)}
    {!conflicts.length&&<p>No overlapping field edits detected.</p>}
    <button type="button" className="secondary" disabled={!resolved||disabled} onClick={()=>{if(resolved)onResolve(resolved);}}>Apply reviewed changes</button>
    <small>This updates the draft's base revision only. Save is still required to change the record.</small>
  </section>;
}

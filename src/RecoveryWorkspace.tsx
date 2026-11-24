import {useEffect,useState} from 'react';
import type {ProjectRecord} from '../shared/records';
import {draftStorage,type DraftRead} from './draftStorage';
type Stored=Extract<DraftRead,{state:'available'|'invalid'}>;
const PAGE=30;
export default function RecoveryWorkspace({projectId,records,incomplete,onReview}:{projectId:string;records:ProjectRecord[];incomplete:boolean;onReview:(id:string)=>void}){
 const [inventory,setInventory]=useState(()=>draftStorage.list(projectId)),[page,setPage]=useState(0),[message,setMessage]=useState('');
 const refresh=()=>setInventory(draftStorage.list(projectId));
 useEffect(()=>{const changed=()=>refresh();window.addEventListener('storage',changed);return()=>window.removeEventListener('storage',changed);},[projectId]);
 const known=new Map(records.map(r=>[r.id,r])),pages=Math.max(1,Math.ceil(inventory.ids.length/PAGE)),current=Math.min(page,pages-1);
 const unchanged=(id:string,observed:Stored)=>{
  const latest=draftStorage.read(projectId,id);
  if((latest.state==='available'||latest.state==='invalid')&&latest.token===observed.token)return true;
  setMessage('Recovery changed or became unavailable. Refresh and review before trying again.');refresh();return false;
 };
 const exportCopy=(id:string,observed:Stored)=>{
  if(!unchanged(id,observed))return;
  try{
   const content=observed.state==='available'?{projectId,recordId:id,...observed.draft}:{projectId,recordId:id,rawRecovery:observed.token};
   const object=URL.createObjectURL(new Blob([JSON.stringify(content,null,2)],{type:'application/json'})),link=document.createElement('a');link.href=object;link.download='prism-recovery-'+id+'.json';document.body.appendChild(link);
   try{link.click();}finally{link.remove();window.setTimeout(()=>URL.revokeObjectURL(object),1000);}
   setMessage('Export requested. Confirm the file was saved in your browser downloads. Recovery has not been removed.');
  }catch{setMessage('Could not export recovery. Stored recovery has not been removed.');}
 };
 const discard=(id:string,observed:Stored)=>{
  if(!window.confirm('Discard this browser-local recovery copy? Unsaved input will be lost. Canonical records will not change.'))return;
  if(!unchanged(id,observed))return;
  const result=draftStorage.write(projectId,id,observed.token,null);
  setMessage(result.state==='stored'?'Recovery copy discarded. Canonical records were not changed.':'Recovery was not discarded. Refresh and review before retrying.');refresh();
 };
 return <section className="recovery-workspace" aria-label="Browser recovery drafts">
 <p className="overview-note">Recovery belongs to this browser profile and project ID. These copies are unsaved drafts, not backups or canonical records. Missing or unreadable records can still have recovery data. Restore the canonical record before saving its draft, or export the recovery copy for manual rescue.</p>
 <div className="recovery-toolbar"><strong>{inventory.state==='unavailable'?'Recovery inventory unavailable':inventory.ids.length+' recovery '+(inventory.ids.length===1?'entry':'entries')}</strong><button type="button" className="secondary" onClick={()=>{refresh();setMessage('');}}>Refresh recovery</button></div>
 {inventory.state!=='available'&&<p className="warning" role="alert">{inventory.state==='unavailable'?'Browser recovery storage could not be enumerated. Existing data has not been changed.':'The recovery inventory is incomplete. Some local entries may not be shown.'}</p>}
 {incomplete&&<p className="warning" role="alert">Canonical records could not all be loaded. An unavailable record does not establish deletion.</p>}
 {message&&<p role="status" className="overview-note">{message}</p>}
 {inventory.state==='available'&&!inventory.ids.length&&<p>No recovery drafts for this project.</p>}
 {inventory.ids.slice(current*PAGE,(current+1)*PAGE).map(id=>{
  const entry=draftStorage.read(projectId,id),record=known.get(id),stored=entry.state==='available'||entry.state==='invalid'?entry:undefined;
  const title=record?.title??(entry.state==='available'?entry.draft.base.title:id);
  return <article key={id} className="recovery-entry" aria-label={'Recovery for '+title}>
   <div><h3>{title}</h3><p className="record-id">{id}</p><p>{entry.state==='invalid'?'Unreadable recovery copy':entry.state==='available'?(record?(entry.draft.baseRevision===record.revision?'Draft against current revision':'Draft needs external revision review'):'Canonical record unavailable'):'Recovery copy no longer available'}</p>
   {entry.state==='available'&&<small>Draft title: {entry.draft.draft.title||'(empty)'} · updated {entry.draft.updatedAt}</small>}</div>
   <div className="recovery-entry-actions">
    {entry.state==='available'&&record&&!incomplete&&<button type="button" className="secondary" onClick={()=>{if(unchanged(id,entry))onReview(id);}}>Review draft</button>}
    {stored&&<><button type="button" className="secondary" onClick={()=>exportCopy(id,stored)}>Export recovery</button><button type="button" className="secondary" onClick={()=>discard(id,stored)}>Discard recovery</button></>}
   </div>
  </article>;
 })}
 {pages>1&&<div className="recovery-toolbar"><button type="button" className="secondary" disabled={current===0} onClick={()=>setPage(current-1)}>Previous</button><span>Page {current+1} of {pages}</span><button type="button" className="secondary" disabled={current===pages-1} onClick={()=>setPage(current+1)}>Next</button></div>}
 </section>;
}

import {useEffect,useMemo,useRef,useState} from 'react';
import type {z} from 'zod';
import {createFormRecovery,type FormRead} from './formRecovery';
export function useDefinitionRecovery<T>(projectId:string,kind:string,codec:z.ZodType<T>){
 const store=useMemo(()=>createFormRecovery(()=>window.localStorage,projectId,kind,codec),[projectId,kind,codec]);
 const [observed,setObserved]=useState<FormRead<T>>(()=>store.read()),[session,setValue]=useState<T|null>(null),[warning,setWarning]=useState('');
 const current=useRef<T|null>(null),token=useRef<string|null>(observed.token);
 const setActive=(value:T|null)=>{current.current=value;setValue(value);};
 const refresh=()=>{const latest=store.read();setObserved(latest);return latest;};
 useEffect(()=>{const update=(e:StorageEvent)=>{if(e.key!==null&&e.key!==store.key)return;const latest=refresh();if(current.current!==null&&latest.token!==token.current)setWarning('Recovery changed in another tab. Current input is retained; export before closing.');};window.addEventListener('storage',update);return()=>window.removeEventListener('storage',update);},[store]);
 const persist=(value:T|null)=>{
  const result=store.write(token.current,value);
  if(result.state!=='stored'){setWarning(result.message);return false;}
  token.current=result.token;setWarning('');refresh();return true;
 };
 const setSession=(next:T|null|((previous:T|null)=>T|null))=>{
  const value=typeof next==='function'?(next as (previous:T|null)=>T|null)(current.current):next;
  if(value!==null&&current.current===null){const latest=refresh();if(latest.state==='available'||latest.state==='invalid'){setWarning('Review or discard the existing recovery copy before starting another definition.');return;}token.current=latest.token;}
  if(value===null){const ok=persist(null);setActive(null);if(!ok){refresh();setWarning('The form was closed, but its recovery copy could not be cleared. Review the stored copy before reusing it.');}return;}
  setActive(value);persist(value);
 };
 const resume=()=>{const latest=refresh();if(latest.state!=='available'||latest.token!==observed.token){setWarning('Recovery changed. Review the current copy before resuming.');return;}token.current=latest.token;setWarning('');setActive(latest.value);};
 const keep=()=>{if(current.current!==null&&persist(current.current)){setActive(null);refresh();}};
 const discard=()=>{if(!window.confirm('Discard this unsaved local definition copy? Saved project data will not change.'))return;const result=store.write(observed.token,null);if(result.state==='stored'){token.current=null;setWarning('');refresh();}else{setWarning(result.message);refresh();}};
 const exportDraft=()=>{
  try{
   const active=current.current,latest=store.read();
   if(active===null&&latest.token!==observed.token){setWarning('Recovery changed. Review the current copy before exporting.');refresh();return;}
   const data=active!==null?{version:1,projectId,kind,value:active}:latest.state==='available'?{version:1,projectId,kind,value:latest.value}:latest.state==='invalid'?{version:1,projectId,kind,rawRecovery:latest.token}:null;
   if(!data)throw Error('No recovery data');
   const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='prism-'+kind+'-recovery.json';document.body.appendChild(a);
   try{a.click();}finally{a.remove();window.setTimeout(()=>URL.revokeObjectURL(url),1000);}
  }catch{setWarning('Export failed. Your recovery data was not removed.');}
 };
 return {session,setSession,observed,warning,resume,keep,discard,exportDraft,canStart:session===null&&observed.state!=='available'&&observed.state!=='invalid'};
}
export function DefinitionRecoveryControls<T>({recovery,disabled,label}:{recovery:ReturnType<typeof useDefinitionRecovery<T>>;disabled:boolean;label:string}){
 const {session,observed,warning,resume,keep,discard,exportDraft}=recovery;
 return <div className="definition-recovery">
 {warning&&<p role="alert" className="warning">{warning}</p>}
 {session!==null?<><small>Local recovery retains unfinished input, not a saved definition.</small><div className="schema-form-actions"><button type="button" className="secondary" disabled={disabled} onClick={keep}>Keep {label} draft &amp; close</button><button type="button" className="secondary" disabled={disabled} onClick={exportDraft}>Export {label} draft</button></div></>:observed.state==='available'||observed.state==='invalid'?<><p className="overview-note">{observed.state==='available'?'An unfinished '+label+' definition is stored in this browser.':'The stored '+label+' recovery copy is unreadable.'}</p><div className="schema-form-actions">{observed.state==='available'&&<button type="button" className="secondary" disabled={disabled} onClick={resume}>Resume {label} draft</button>}<button type="button" className="secondary" disabled={disabled} onClick={exportDraft}>Export {label} draft</button><button type="button" className="secondary" disabled={disabled} onClick={discard}>Discard {label} draft</button></div></>:observed.state==='unavailable'?<p className="warning">Browser recovery is unavailable for this form. Export unfinished input before leaving.</p>:null}
 </div>;
}

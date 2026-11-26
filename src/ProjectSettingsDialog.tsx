import {useId,useLayoutEffect,useRef,useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {Settings,X} from 'lucide-react';
import type {ProjectInfo,ProjectSettingsResult,UpdateProjectSettingsInput} from '../shared/projects';
import {api} from './api';
type Props={projects:ProjectInfo[];activeId:string;blocked:string;dirty:boolean;onDirtyChange:(dirty:boolean)=>void;pending:boolean;error?:string;onResetError:()=>void;onSave:(id:string,input:UpdateProjectSettingsInput)=>void;onClose:()=>void};
function SettingsForm({initial,blocked,pending,error,onDirtyChange,onSave,onCancel}:{initial:ProjectSettingsResult;blocked:string;pending:boolean;error?:string;onDirtyChange:(dirty:boolean)=>void;onSave:(input:UpdateProjectSettingsInput)=>void;onCancel:()=>void}){
 const [base]=useState(initial);
 const [title,setTitle]=useState(base.project.title),[product,setProduct]=useState(base.project.profiles.includes('product')),[game,setGame]=useState(base.project.profiles.includes('game')),[repository,setRepository]=useState(base.project.githubRepository??'');
 const dirty=title!==base.project.title||product!==base.project.profiles.includes('product')||game!==base.project.profiles.includes('game')||repository!==(base.project.githubRepository??'');
 useLayoutEffect(()=>{onDirtyChange(dirty);return()=>onDirtyChange(false);},[dirty,onDirtyChange]);
 const stale=initial.revision!==base.revision;
 const allowed=initial.editable&&!blocked&&!pending&&!stale;
 return <form className="workspace-create-form project-settings-form" onSubmit={e=>{e.preventDefault();if(allowed&&dirty&&title.trim())onSave({expectedRevision:base.revision,title,product,game,githubRepository:repository.trim()||null});}}>
  <fieldset disabled={!initial.editable||pending||stale}>
   <label>Project name<input required maxLength={120} value={title} onChange={e=>setTitle(e.target.value)}/></label>
   <div className="project-settings-areas"><strong>Visible project areas</strong><label><input type="checkbox" checked={product} onChange={e=>setProduct(e.target.checked)}/> Product development</label><label><input type="checkbox" checked={game} onChange={e=>setGame(e.target.checked)}/> Game design</label><small>Changing navigation does not remove records.</small></div>
   {base.project.storage==='repository'&&<label>GitHub repository<input value={repository} maxLength={140} onChange={e=>setRepository(e.target.value)} placeholder="owner/repository"/><small>Optional. Leave blank to disconnect GitHub metadata. Local files are unchanged.</small></label>}
  </fieldset>
  {!initial.editable&&<p className="warning" role="status">{initial.reason}</p>}
  {stale&&<p className="warning" role="alert">Settings changed while this form was open. Close and reopen to review the current values.</p>}
  {blocked&&<p className="warning" role="status">{blocked}</p>}
  {error&&<p className="warning" role="alert">{error} Your changes are still here.</p>}
  {pending&&<p role="status">Saving project settings…</p>}
  <div className="dialog-actions"><button type="button" className="secondary" disabled={pending} onClick={onCancel}>Cancel</button><button type="submit" className="primary" disabled={!allowed||!dirty||!title.trim()}>{pending?'Saving…':'Save settings'}</button></div>
 </form>;
}
export default function ProjectSettingsDialog({projects,activeId,blocked,dirty,onDirtyChange,pending,error,onResetError,onSave,onClose}:Props){
 const dialog=useRef<HTMLDialogElement>(null),close=useRef<HTMLButtonElement>(null),heading=useId(),description=useId();
 const [selected,setSelected]=useState(activeId);
 const query=useQuery({queryKey:['project-settings',selected],queryFn:()=>api.projectSettings(selected),refetchOnWindowFocus:false,retry:false,staleTime:0});
 useLayoutEffect(()=>{const el=dialog.current;if(!el)return;el.showModal();close.current?.focus();return()=>{if(el.open)el.close();};},[]);
 const dismiss=()=>{if(pending||dirty&&!window.confirm('Discard unsaved project settings?'))return;if(dialog.current?.open)dialog.current.close();onClose();};
 return <dialog ref={dialog} className="prism-dialog project-registration-dialog" aria-labelledby={heading} aria-describedby={description} onCancel={e=>{e.preventDefault();dismiss();}}>
  <div className="dialog-header"><div className="registration-symbol"><Settings size={21} aria-hidden="true"/></div><button ref={close} className="icon-button" type="button" aria-label="Close project setup" disabled={pending} onClick={dismiss}><X size={18}/></button></div>
  <h2 id={heading}>Manage projects</h2>
  <p id={description}>Change project settings without moving or deleting files.</p>
  <label className="registration-storage">Project<select value={selected} disabled={pending||dirty} onChange={e=>{onResetError();setSelected(e.target.value);}}>{projects.map(p=><option key={p.id} value={p.id}>{p.title}</option>)}</select></label>
  {dirty&&<p className="overview-note">Save or cancel changes before choosing another project.</p>}
  {query.isPending&&<p role="status">Opening project settings…</p>}
  {query.isError&&<p className="warning" role="alert">Could not load settings. <button type="button" className="secondary" onClick={()=>void query.refetch()}>Retry</button></p>}
  {query.data&&<SettingsForm key={selected} initial={query.data} blocked={blocked} pending={pending} error={error} onDirtyChange={onDirtyChange} onSave={input=>onSave(selected,input)} onCancel={dismiss}/>}
 </dialog>;
}

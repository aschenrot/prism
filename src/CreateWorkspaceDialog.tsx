import {useId,useLayoutEffect,useRef,useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {FolderPlus,X} from 'lucide-react';
import type {CreateWorkspaceInput} from '../shared/projects';
import {api} from './api';
const profiles:{value:CreateWorkspaceInput['profile'];label:string;description:string}[]=[
 {value:'general',label:'General project',description:'Tasks, notes and project planning'},
 {value:'product',label:'Product development',description:'Strategy, features and requirements'},
 {value:'game',label:'Game development',description:'Gameplay, world, characters and assets'}
];
export default function CreateWorkspaceDialog({blocked,pending,error,onCreate,onClose}:{blocked:string;pending:boolean;error?:string;onCreate:(input:CreateWorkspaceInput)=>void;onClose:()=>void}){
 const dialog=useRef<HTMLDialogElement>(null),close=useRef<HTMLButtonElement>(null),heading=useId(),description=useId();
 const [title,setTitle]=useState(''),[profile,setProfile]=useState<CreateWorkspaceInput['profile']>('general');
 const [requestId]=useState(()=>crypto.randomUUID());
 const availability=useQuery({queryKey:['workspace-creation'],queryFn:api.workspaceCreation,staleTime:0,retry:false});
 useLayoutEffect(()=>{const el=dialog.current;if(!el)return;el.showModal();close.current?.focus();return()=>{if(el.open)el.close();};},[]);
 const dismiss=()=>{if(pending)return;if(dialog.current?.open)dialog.current.close();onClose();};
 const canCreate=!!title.trim()&&availability.data?.available&&!blocked&&!pending&&!availability.isError;
 return <dialog ref={dialog} className="prism-dialog project-registration-dialog create-workspace-dialog" aria-labelledby={heading} aria-describedby={description} onCancel={e=>{e.preventDefault();dismiss();}}>
  <div className="dialog-header"><div className="registration-symbol"><FolderPlus size={21} aria-hidden="true"/></div><button ref={close} className="icon-button" type="button" aria-label="Close project setup" disabled={pending} onClick={dismiss}><X size={18}/></button></div>
  <h2 id={heading}>Create workspace</h2>
  <p id={description}>Start a new project in Prism. Your files are stored locally in Prism's managed workspace folder.</p>
  <form className="workspace-create-form" onSubmit={e=>{e.preventDefault();if(canCreate)onCreate({title,profile,requestId});}}>
   <label>Workspace name<input required maxLength={120} value={title} disabled={pending} placeholder="My project" onChange={e=>setTitle(e.target.value)}/></label>
   <fieldset disabled={pending}><legend>Project profile</legend>{profiles.map(p=><label key={p.value} className="workspace-profile-option"><input type="radio" name="workspace-profile" value={p.value} checked={profile===p.value} onChange={()=>setProfile(p.value)}/><span><strong>{p.label}</strong><small>{p.description}</small></span></label>)}</fieldset>
   {availability.isPending&&<p role="status">Checking workspace availability…</p>}
   {availability.isError&&<p role="alert" className="warning">Could not check workspace availability. <button type="button" className="secondary" onClick={()=>void availability.refetch()}>Retry</button></p>}
   {availability.data&&!availability.data.available&&<p role="status" className="warning">{availability.data.reason}</p>}
   {blocked&&!pending&&<p role="status" className="warning">{blocked}</p>}
   {error&&<p role="alert" className="warning">{error} Your setup choices are retained. Retry the same request if appropriate.</p>}
   {pending&&<p role="status">Creating workspace…</p>}
   <div className="dialog-actions"><button type="button" className="secondary" disabled={pending} onClick={dismiss}>Cancel</button><button className="primary" type="submit" disabled={!canCreate}>{pending?'Creating…':'Create workspace'}</button></div>
  </form>
 </dialog>;
}

import {useId,useLayoutEffect,useRef,useState} from 'react';
import {FolderOpen,Settings,Copy,X,Terminal} from 'lucide-react';
import type {ProjectInfo} from '../shared/projects';
export type RegistrationMode='create'|'connect'|'manage';
type GuideMode=Exclude<RegistrationMode,'create'>;
const labels:Record<GuideMode,string>={connect:'Connect existing project',manage:'Manage projects'};
const commands={
 create:'npm run project -- add my-project "My project" "ABSOLUTE_FOLDER_PATH" standalone core,product,project',
 connect:'npm run project -- add my-project "My project" "ABSOLUTE_FOLDER_PATH" repository core,product,project',
 manage:'npm run project -- settings my-project "My project" core,product,project'
};
export default function ProjectRegistrationGuide({mode,projects,blocked,onClose}:{mode:GuideMode;projects:ProjectInfo[];blocked:string;onClose:()=>void}){
 const dialog=useRef<HTMLDialogElement>(null),close=useRef<HTMLButtonElement>(null),heading=useId(),description=useId();
 const [selected,setSelected]=useState(mode),[storage,setStorage]=useState<'repository'|'standalone'>(mode==='connect'?'repository':'standalone'),[message,setMessage]=useState('');
 useLayoutEffect(()=>{const el=dialog.current;if(!el)return;el.showModal();close.current?.focus();return()=>{if(el.open)el.close();};},[]);
 const dismiss=()=>{if(dialog.current?.open)dialog.current.close();onClose();};
 const command=selected==='manage'?commands.manage:storage==='repository'?commands.connect:commands.create;
 const copy=async()=>{try{await navigator.clipboard.writeText(command);setMessage('Command template copied. Replace the example values before running it.');}catch{setMessage('Clipboard unavailable. Select and copy the command text manually.');}};
 const Icon=selected==='connect'?FolderOpen:Settings;
 return <dialog ref={dialog} className="prism-dialog project-registration-dialog" aria-labelledby={heading} aria-describedby={description} onCancel={e=>{e.preventDefault();dismiss();}}>
  <div className="dialog-header"><div className="registration-symbol"><Icon size={21}/></div><button ref={close} className="icon-button" type="button" aria-label="Close project setup" onClick={dismiss}><X size={18}/></button></div>
  <h2 id={heading}>{labels[selected]}</h2>
  <p id={description}>Prism registers local folders through your terminal. This guide does not create, access or modify a folder from the browser.</p>
  <div className="registration-modes" role="group" aria-label="Project setup action">{(Object.keys(labels) as GuideMode[]).map(value=><button key={value} type="button" className="secondary" aria-pressed={selected===value} onClick={()=>{setSelected(value);setStorage(value==='connect'?'repository':'standalone');setMessage('');}}>{labels[value]}</button>)}</div>
  {blocked&&<p className="warning" role="status">{blocked} Resolve this before stopping Prism.</p>}
  {selected==='manage'?<><h3>Registered projects</h3><ul className="registration-projects">{projects.map(p=><li key={p.id}><strong>{p.title}</strong><small>{p.id} · {p.storage==='repository'?'Connected repository':'Local workspace'}</small></li>)}</ul><p>Settings replaces the title, entire profile list and GitHub association. Include the existing owner/repository argument to retain that association; omitting it or using a dash clears it. Project IDs, roots and storage modes stay unchanged. Removal and relocation are not supported here.</p></>:<><label className="registration-storage">Storage<select aria-label="Project storage" value={storage} onChange={e=>{setStorage(e.target.value==='repository'?'repository':'standalone');setMessage('');}}><option value="standalone">Standalone workspace</option><option value="repository">Existing Git repository</option></select></label><p>{storage==='repository'?'Use the root of an existing Git repository. Prism will store records in its .prism directory; this guide does not initialize Git.':'Use a separate existing folder for records. Use a folder you have already authorized locally.'}</p></>}
  <h3><Terminal size={15} aria-hidden="true"/> Local authorization</h3>
  <ol className="registration-steps"><li>Save or retain unsaved work, then stop the Prism development server.</li><li>Open a terminal in the Prism source checkout. {selected==='manage'?'List the current project IDs with the command below.':'Choose an unused project ID, a title and the absolute path of the existing folder.'}</li><li>Run the command template below after replacing its example values.</li><li>Run <code>npm run dev</code> and select the registered project from the project dropdown.</li></ol>
  {selected==='manage'&&<pre className="registration-command">npm run project -- list</pre>}
  <pre className="registration-command" aria-label="Registration command template">{command}</pre>
  <button type="button" className="secondary" onClick={()=>void copy()}><Copy size={15}/> Copy command template</button>
  {message&&<p role="status">{message}</p>}
  <p className="overview-note">Local registry changes take effect on restart. Explicit environment overrides must be resolved in the terminal. See docs/project-registration.md in the source checkout.</p>
  <div className="dialog-actions"><button type="button" className="secondary" onClick={dismiss}>Done</button></div>
 </dialog>;
}

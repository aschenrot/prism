import {useId,useLayoutEffect,useRef,useState} from 'react';
import {FolderOpen,Copy,X,Terminal} from 'lucide-react';
export type RegistrationMode='create'|'connect'|'manage';
const commands={
 standalone:'npm run project -- add my-project "My project" "ABSOLUTE_FOLDER_PATH" standalone core,product,project',
 repository:'npm run project -- add my-project "My project" "ABSOLUTE_FOLDER_PATH" repository core,product,project'
};
export default function ProjectRegistrationGuide({blocked,onClose}:{blocked:string;onClose:()=>void}){
 const dialog=useRef<HTMLDialogElement>(null),close=useRef<HTMLButtonElement>(null),heading=useId(),description=useId();
 const [storage,setStorage]=useState<'repository'|'standalone'>('repository'),[message,setMessage]=useState('');
 useLayoutEffect(()=>{const el=dialog.current;if(!el)return;el.showModal();close.current?.focus();return()=>{if(el.open)el.close();};},[]);
 const dismiss=()=>{if(dialog.current?.open)dialog.current.close();onClose();};
 const command=commands[storage];
 const copy=async()=>{try{await navigator.clipboard.writeText(command);setMessage('Setup command copied. Replace the example values before running it.');}catch{setMessage('Clipboard unavailable. Select and copy the command text manually.');}};
 return <dialog ref={dialog} className="prism-dialog project-registration-dialog" aria-labelledby={heading} aria-describedby={description} onCancel={e=>{e.preventDefault();dismiss();}}>
  <div className="dialog-header"><div className="registration-symbol"><FolderOpen size={21} aria-hidden="true"/></div><button ref={close} className="icon-button" type="button" aria-label="Close project setup" onClick={dismiss}><X size={18}/></button></div>
  <h2 id={heading}>Connect existing project</h2>
  <p id={description}>Connecting an existing folder requires local authorization. This guide does not create, access or modify a folder from the browser.</p>
  {blocked&&<p className="warning" role="status">{blocked} Resolve this before stopping Prism.</p>}
  <label className="registration-storage">Storage<select aria-label="Project storage" value={storage} onChange={e=>{setStorage(e.target.value==='repository'?'repository':'standalone');setMessage('');}}><option value="standalone">Standalone workspace</option><option value="repository">Existing Git repository</option></select></label>
  <p>{storage==='repository'?'Use the root of an existing Git repository. Prism stores records in its .prism directory; it does not initialize Git.':'Use an existing standalone project folder.'}</p>
  <h3><Terminal size={15} aria-hidden="true"/> Local authorization</h3>
  <ol className="registration-steps"><li>Save or retain unsaved work, then stop the Prism server.</li><li>Open a terminal in the Prism source checkout. Choose an unused project ID, a name and the absolute path of the existing folder.</li><li>Replace the example values and run the setup command below.</li><li>Run <code>npm run dev</code> and select the project.</li></ol>
  <pre className="registration-command" aria-label="Registration command template">{command}</pre>
  <button type="button" className="secondary" onClick={()=>void copy()}><Copy size={15}/> Copy setup command</button>
  {message&&<p role="status">{message}</p>}
  <p className="overview-note">See docs/project-registration.md for explicit configuration overrides and folder requirements.</p>
  <div className="dialog-actions"><button type="button" className="secondary" onClick={dismiss}>Done</button></div>
 </dialog>;
}

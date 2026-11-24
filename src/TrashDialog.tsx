import { useId,useLayoutEffect,useRef } from 'react';
import { AlertTriangle,Trash2,X } from 'lucide-react';
import type { ProjectRecord } from '../shared/records';
type Props={record:ProjectRecord;incoming:ProjectRecord[];incomplete:boolean;blocked?:string;error?:string;pending:boolean;onCancel:()=>void;onConfirm:()=>void};
export default function TrashDialog({record,incoming,incomplete,blocked,error,pending,onCancel,onConfirm}:Props){
  const ref=useRef<HTMLDialogElement>(null),cancelRef=useRef<HTMLButtonElement>(null),heading=useId(),description=useId();
  useLayoutEffect(()=>{
    const dialog=ref.current;if(!dialog)return;
    const previous=document.activeElement instanceof HTMLElement?document.activeElement:null;
    dialog.showModal();cancelRef.current?.focus();
    return()=>{if(dialog.open)dialog.close();if(previous?.isConnected)previous.focus({preventScroll:true});};
  },[]);
  return <dialog ref={ref} className="prism-dialog trash-dialog" aria-labelledby={heading} aria-describedby={description} onCancel={event=>{event.preventDefault();if(!pending)onCancel();}}>
    <div className="dialog-header"><div className="dialog-symbol">{blocked?<AlertTriangle size={20}/>:<Trash2 size={20}/>}</div><button type="button" className="icon-button" aria-label="Close dialog" disabled={pending} onClick={onCancel}><X size={18}/></button></div>
    <h2 id={heading}>{blocked?'Cannot move record':'Move record to trash?'}</h2>
    <p id={description}>{blocked||'The record will disappear from active collections. You can restore it later from Trash.'}</p>
    <div className="dialog-record"><strong>{record.title}</strong><small>{record.type} · {record.id}</small></div>
    {!blocked&&<div className="dialog-impact"><strong>{incoming.length===0?'No known incoming links':incoming.length+' linked record'+(incoming.length===1?'':'s')}</strong>{incoming.length>0&&<><p>These records may show missing links until restoration.</p><ul>{incoming.slice(0,5).map(r=><li key={r.id}>{r.title}</li>)}</ul>{incoming.length>5&&<small>And {incoming.length-5} more.</small>}</>}{incomplete&&<p>Some records could not be read; the incoming-link list may be incomplete.</p>}<p>Original content, relationships and acceptance evidence are preserved.</p></div>}
    {error&&<p className="warning" role="alert">{error}</p>}
    <div className="dialog-actions"><button ref={cancelRef} type="button" className="secondary" disabled={pending} onClick={onCancel}>{blocked?'Close':'Cancel'}</button>{!blocked&&<button type="button" className="danger-button" disabled={pending||!!error} onClick={onConfirm}><Trash2 size={15}/>{pending?'Moving…':'Move to trash'}</button>}</div>
  </dialog>;
}

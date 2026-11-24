import { AlertTriangle,CheckCircle2,X } from 'lucide-react';
export type RecordNoticeData={title:string;message:string;kind:'success'|'warning';viewTrash?:boolean;copyValue?:string};
export default function RecordNotice({notice,onDismiss,onViewTrash}:{notice:RecordNoticeData;onDismiss:()=>void;onViewTrash:()=>void}){
  return <div className={'navigation-toast '+(notice.kind==='success'?'record-notice':'')} role="status" aria-live="polite">{notice.kind==='success'?<CheckCircle2 size={19}/>:<AlertTriangle size={19}/>}<div><strong>{notice.title}</strong><p>{notice.message}</p>{notice.copyValue&&<input readOnly aria-label="Record link" value={notice.copyValue} onFocus={e=>e.currentTarget.select()}/>}{notice.viewTrash&&<button className="notice-action" type="button" onClick={onViewTrash}>View Trash</button>}</div><button type="button" className="icon-button" aria-label="Dismiss record notification" onClick={onDismiss}><X size={17}/></button></div>;
}

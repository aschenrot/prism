import { CheckCircle2,X } from 'lucide-react';
export default function RecordNotice({message,onDismiss,onViewTrash}:{message:string;onDismiss:()=>void;onViewTrash:()=>void}){
  return <div className="navigation-toast record-notice" role="status" aria-live="polite"><CheckCircle2 size={19}/><div><strong>Record moved</strong><p>{message}</p><button className="notice-action" type="button" onClick={onViewTrash}>View Trash</button></div><button type="button" className="icon-button" aria-label="Dismiss record notification" onClick={onDismiss}><X size={17}/></button></div>;
}

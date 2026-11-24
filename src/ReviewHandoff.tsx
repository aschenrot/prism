import { useState } from 'react';
import { ClipboardCopy } from 'lucide-react';
import { reviewSummary } from '../shared/reviewSummary';
import type { AcceptanceRun } from '../shared/acceptance';
export default function ReviewHandoff({run,unsaved}:{run:AcceptanceRun;unsaved:boolean}){
  const [message,setMessage]=useState(''),[fallback,setFallback]=useState(false);
  const summary=reviewSummary(run);
  const copy=async()=>{
    try{await navigator.clipboard.writeText(summary);setMessage('Saved review summary copied. Paste it into the pull request or this chat.');setFallback(false);}
    catch{setFallback(true);setMessage('Clipboard access unavailable. Select and copy the summary below.');}
  };
  return <div className="review-copy"><button className="secondary" type="button" disabled={unsaved} onClick={()=>{void copy();}}><ClipboardCopy size={15}/> Copy review summary</button>{message&&<span className="review-copy-message" role="status">{message}</span>}{fallback&&<textarea aria-label="Saved review summary" readOnly rows={7} value={summary} onFocus={e=>e.target.select()}/>}</div>;
}

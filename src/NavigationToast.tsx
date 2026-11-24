import { useEffect,useRef } from 'react';
import { AlertTriangle,X } from 'lucide-react';
export default function NavigationToast({message,onDismiss}:{message:string;onDismiss:()=>void}){
  const close=useRef(onDismiss);close.current=onDismiss;
  useEffect(()=>{
    if(!message)return;
    const listener=(event:KeyboardEvent)=>{if(event.key==='Escape')close.current();};
    window.addEventListener('keydown',listener);return()=>window.removeEventListener('keydown',listener);
  },[message]);
  if(!message)return null;
  return <div className="navigation-toast" role="status" aria-live="polite"><AlertTriangle size={19} aria-hidden="true"/><div><strong>Navigation paused</strong><p>{message}</p></div><button type="button" className="icon-button" aria-label="Dismiss notification" onClick={onDismiss}><X size={17}/></button></div>;
}

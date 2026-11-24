import { useEffect,useLayoutEffect,useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Inbox as InboxIcon,Plus } from 'lucide-react';
import type { ProjectRecord } from '../shared/records';
import { api } from './api';
import RouteLink from './RouteLink';
export default function Inbox({projectId,records,incomplete,onOpen,hrefFor,onMerge,onRefresh,onBusyChange}:{projectId:string;records:ProjectRecord[];incomplete:boolean;onOpen:(id:string)=>void;hrefFor:(id:string)=>string;onMerge:(records:ProjectRecord[])=>Promise<void>;onRefresh:()=>void;onBusyChange:(busy:boolean)=>void}){
 const [title,setTitle]=useState(''),[body,setBody]=useState(''),[message,setMessage]=useState('');
 const capture=useMutation({mutationFn:()=>api.capture(projectId,title,body),onSuccess:async r=>{await onMerge([r]);setTitle('');setBody('');setMessage('Captured '+r.title+' in this project.');},onSettled:onRefresh});
 const triage=useMutation({mutationFn:(r:ProjectRecord)=>api.setInbox(projectId,r.id,r.revision,false),onSuccess:async r=>{await onMerge([r]);setMessage(r.title+' moved out of the inbox. The record remains in your library.');},onSettled:onRefresh});
 const dirty=!!(title||body),pending=capture.isPending||triage.isPending;
 useLayoutEffect(()=>{onBusyChange(dirty||pending);},[dirty,pending,onBusyChange]);useLayoutEffect(()=>()=>onBusyChange(false),[onBusyChange]);
 useEffect(()=>{if(!dirty&&!pending)return;const warn=(e:BeforeUnloadEvent)=>{e.preventDefault();e.returnValue='';};window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn);},[dirty,pending]);
 const entries=records.filter(r=>r.inbox===true).sort((a,b)=>(b.createdAt??'').localeCompare(a.createdAt??'')||a.id.localeCompare(b.id));
 return <section className="inbox-panel" aria-label="Project inbox">
 <div className="eyebrow"><InboxIcon size={14}/> QUICK CAPTURE</div>
 <form className="inbox-capture schema-form" onSubmit={e=>{e.preventDefault();if(!pending&&title.trim())capture.mutate();}}>
 <label>Capture title<input required maxLength={160} disabled={pending} value={title} onChange={e=>setTitle(e.target.value)}/></label>
 <label>Notes<textarea rows={4} maxLength={50000} disabled={pending} value={body} onChange={e=>setBody(e.target.value)} placeholder="Optional initial notes"/></label>
 <div className="schema-form-actions"><button className="primary" disabled={pending||!title.trim()}><Plus size={15}/> Capture</button><button type="button" className="secondary" disabled={pending||!dirty} onClick={()=>{if(window.confirm('Discard unsaved capture?')){setTitle('');setBody('');capture.reset();}}}>Clear capture</button></div>
 </form>
 {capture.error&&<p role="alert" className="warning">{capture.error.message} Input retained.</p>}
 {triage.error&&<p role="alert" className="warning">{triage.error.message} Refresh and review before retrying.</p>}
 {message&&<p role="status">{message}</p>}
 <h2>Needs triage <small>{entries.length}</small></h2>
 {incomplete&&<p className="warning">Some records could not be read; inbox may be incomplete.</p>}
 <p className="overview-note">Captured items are ordinary saved Idea records. Open and edit them in the normal editor. Finishing triage clears the inbox flag only; no content, status, type, links or identity is removed.</p>
 {!entries.length&&<p>No items need triage.</p>}
 <div className="inbox-list">{entries.map(r=><article className="schema-list-row" key={r.id}><div><RouteLink href={hrefFor(r.id)} onNavigate={()=>onOpen(r.id)}>{r.title}</RouteLink><p>{r.type} · {r.status} · {r.priority}</p>{r.body&&<p>{r.body.slice(0,180)}{r.body.length>180?'…':''}</p>}</div><button className="secondary" disabled={dirty||pending} aria-label={'Finish triage for '+r.title} onClick={()=>triage.mutate(r)}>Finish triage</button></article>)}</div>
 </section>;
}

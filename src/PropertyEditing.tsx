import { useId,useLayoutEffect,useRef,useState,type FormEvent } from 'react';
import { CheckCircle2,AlertTriangle,SlidersHorizontal,X } from 'lucide-react';
import { statuses,priorities,type ProjectRecord,type PropertyChanges } from '../shared/records';
export type PropertyResult={updated:ProjectRecord[];issues:{id:string;title:string;message:string}[]};
export function PropertyCell({record,field,disabled,onChange}:{record:ProjectRecord;field:'status'|'priority';disabled:boolean;onChange:(changes:PropertyChanges)=>void}){
 const options=field==='status'?statuses:priorities;
 return <div className={'property-cell '+field+'-cell'} onClick={event=>event.stopPropagation()}>
   <select aria-label={(field==='status'?'Status':'Priority')+' for '+record.title} className={'property-select '+(field==='status'?'property-'+record.status.toLowerCase().replace(' ','-'):'')} value={record[field]} disabled={disabled} onChange={e=>{const value=e.target.value;if(field==='status')onChange({status:value as ProjectRecord['status']});else onChange({priority:value as ProjectRecord['priority']});}}>{options.map(option=><option key={option}>{option}</option>)}</select>
 </div>;
}
export function BulkPropertiesDialog({targets,pending,result,onApply,onClose}:{targets:ProjectRecord[];pending:boolean;result:PropertyResult|null;onApply:(changes:PropertyChanges)=>void;onClose:()=>void}){
 const ref=useRef<HTMLDialogElement>(null),initial=useRef<HTMLSelectElement>(null),heading=useId(),description=useId();
 const [status,setStatus]=useState(''),[priority,setPriority]=useState('');
 useLayoutEffect(()=>{const dialog=ref.current;if(!dialog)return;const previous=document.activeElement instanceof HTMLElement?document.activeElement:null;dialog.showModal();initial.current?.focus();return()=>{if(dialog.open)dialog.close();if(previous?.isConnected)previous.focus({preventScroll:true});};},[]);
 const submit=(event:FormEvent)=>{event.preventDefault();if(pending||result||(!status&&!priority))return;onApply({...(status?{status:status as ProjectRecord['status']}:{}),...(priority?{priority:priority as ProjectRecord['priority']}:{})});};
 return <dialog ref={ref} className="prism-dialog bulk-dialog" aria-labelledby={heading} aria-describedby={description} onCancel={event=>{event.preventDefault();if(!pending)onClose();}}>
 <div className="dialog-header"><div className="dialog-symbol bulk-symbol"><SlidersHorizontal size={20}/></div><button type="button" className="icon-button" aria-label="Close dialog" disabled={pending} onClick={onClose}><X size={18}/></button></div>
 <h2 id={heading}>{result?'Bulk edit results':'Edit '+targets.length+' selected records'}</h2>
 <p id={description}>{result?'Only acknowledged updates are counted. Review any unconfirmed records before retrying.':'Set authored status or priority. Other properties and recovery drafts are not overwritten. Each record is checked independently; some may be skipped or fail.'}</p>
 {result?<div className="bulk-results" role="status"><p className="bulk-result-count"><CheckCircle2 size={16}/> {result.updated.length} confirmed · {result.issues.length} not updated or unconfirmed</p>{result.issues.map(issue=><div className="bulk-issue" key={issue.id}><AlertTriangle size={15}/><div><strong>{issue.title}</strong><p>{issue.message}</p></div></div>)}</div>:<form onSubmit={submit}>
 <div className="dialog-record bulk-targets">{targets.slice(0,6).map(r=><span key={r.id}>{r.title}</span>)}{targets.length>6&&<small>And {targets.length-6} more selected records.</small>}</div>
 <div className="bulk-fields"><label>Status<select aria-label="Status" ref={initial} value={status} disabled={pending} onChange={e=>setStatus(e.target.value)}><option value="">Keep unchanged</option>{statuses.map(value=><option key={value}>{value}</option>)}</select></label><label>Priority<select aria-label="Priority" value={priority} disabled={pending} onChange={e=>setPriority(e.target.value)}><option value="">Keep unchanged</option>{priorities.map(value=><option key={value}>{value}</option>)}</select></label></div>
 <div className="dialog-actions"><button className="secondary" type="button" disabled={pending} onClick={onClose}>Cancel</button><button className="primary" disabled={pending||(!status&&!priority)}>{pending?'Applying…':'Apply changes'}</button></div></form>}
 {result&&<div className="dialog-actions"><button className="primary" type="button" onClick={onClose}>Done</button></div>}
 </dialog>;
}

import { useState } from 'react';
import { ArrowUpRight, ArrowLeft, Link2, BookOpen, AlertTriangle } from 'lucide-react';
import type { ProjectRecord } from '../shared/records';
import { relationshipsFor } from '../shared/views';
import MarkdownBody from './Markdown';
export function RecordLinks({records,id,onSelect}:{records:ProjectRecord[];id:string;onSelect:(id:string)=>void}){
  const links=relationshipsFor(records,id);
  return <div className="record-links">
    <div className="eyebrow"><Link2 size={13}/> OUTGOING · {links.outgoing.length}</div>
    {links.outgoing.map(link=>link.record?<button type="button" className="linked-row" key={link.id} onClick={()=>onSelect(link.id)}><span>{link.record.title}<small>{link.record.type}</small></span><ArrowUpRight size={13}/></button>:<p key={link.id} className="missing-link"><AlertTriangle size={13}/> {link.id}</p>)}
    {!links.outgoing.length&&<p className="link-empty">No outgoing links.</p>}
    <div className="eyebrow"><ArrowLeft size={13}/> BACKLINKS · {links.incoming.length}</div>
    {links.incoming.map(r=><button type="button" className="linked-row" key={r.id} onClick={()=>onSelect(r.id)}><span>{r.title}<small>{r.type}</small></span><ArrowUpRight size={13}/></button>)}
    {!links.incoming.length&&<p className="link-empty">No incoming links.</p>}
  </div>;
}
export function Knowledge({mode,visible,records,onEdit}:{mode:'Wiki'|'Relationships';visible:ProjectRecord[];records:ProjectRecord[];onEdit:(id:string)=>void}){
  const [focus,setFocus]=useState('');
  const active=records.find(r=>r.id===focus)||visible[0];
  return <section className="knowledge-panel"><nav className="knowledge-index" aria-label="Knowledge index">
    <div className="eyebrow">{mode==='Wiki'?'ARTICLES':'RECORDS'} / {visible.length}</div>
    {visible.map(r=><button type="button" className={'knowledge-entry '+(r.id===active?.id?'active':'')} key={r.id} onClick={()=>setFocus(r.id)} aria-pressed={r.id===active?.id}><span>{r.title}<small>{r.type}</small></span></button>)}
    {!visible.length&&<p className="link-empty">No records match these filters.</p>}
  </nav><article className="knowledge-article">{active?<><div className="knowledge-heading"><div><div className="eyebrow"><BookOpen size={14}/> {active.type} / {active.status}</div><h2>{active.title}</h2></div><button className="secondary" onClick={()=>onEdit(active.id)}>Edit record <ArrowUpRight size={13}/></button></div>
  {!visible.some(r=>r.id===active.id)&&<p className="link-empty">Linked record outside the current filter.</p>}
  {mode==='Wiki'?<MarkdownBody body={active.body}/>:<div className="relationship-hero"><span className={'dot '+active.accent}/><div><strong>{active.title}</strong><small>Direct links and backlinks from canonical records</small></div></div>}
  <RecordLinks records={records} id={active.id} onSelect={setFocus}/></>:<p className="link-empty">Select a record to explore.</p>}</article></section>;
}

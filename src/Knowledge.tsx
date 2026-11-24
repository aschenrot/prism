import { lazy,Suspense } from 'react';
import { ArrowUpRight, BookOpen } from 'lucide-react';
import type { ProjectRecord } from '../shared/records';
import { RecordLinks } from './RecordLinks';
import RouteLink from './RouteLink';
// Keep the common navigation and relationship shell synchronous; load only the Markdown renderer.
const MarkdownBody=lazy(()=>import('./Markdown'));
export function Knowledge({mode,visible,records,onEdit,focus,onFocus,hrefFor}:{mode:'Wiki'|'Relationships';visible:ProjectRecord[];records:ProjectRecord[];onEdit:(id:string)=>void;focus?:string;onFocus:(id:string)=>void;hrefFor:(id:string)=>string}){
  const active=records.find(r=>r.id===focus)||visible[0];
  return <section className="knowledge-panel"><nav className="knowledge-index" aria-label="Knowledge index">
    <div className="eyebrow">{mode==='Wiki'?'ARTICLES':'RECORDS'} / {visible.length}</div>
    {visible.map(r=><button type="button" className={'knowledge-entry '+(r.id===active?.id?'active':'')} key={r.id} onClick={()=>onFocus(r.id)} aria-pressed={r.id===active?.id}><span>{r.title}<small>{r.type}</small></span></button>)}
    {!visible.length&&<p className="link-empty">No records match these filters.</p>}
  </nav><article className="knowledge-article">{active?<><div className="knowledge-heading"><div><div className="eyebrow"><BookOpen size={14}/> {active.type} / {active.status}</div><h2>{active.title}</h2></div><RouteLink className="secondary" href={hrefFor(active.id)} onNavigate={()=>onEdit(active.id)}>Open record <ArrowUpRight size={13}/></RouteLink></div>
  {!visible.some(r=>r.id===active.id)&&<p className="link-empty">Linked record outside the current filter.</p>}
  {mode==='Wiki'?<Suspense fallback={<div className="markdown-loading" role="status">Loading article…</div>}><MarkdownBody body={active.body}/></Suspense>:<div className="relationship-hero"><span className={'dot '+active.accent}/><div><strong>{active.title}</strong><small>Direct links and backlinks from canonical records</small></div></div>}
  <RecordLinks records={records} id={active.id} onSelect={onEdit} hrefFor={hrefFor}/></>:<p className="link-empty">Select a record to explore.</p>}</article></section>;
}

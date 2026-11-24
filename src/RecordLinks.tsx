import { ArrowUpRight, ArrowLeft, Link2, AlertTriangle } from 'lucide-react';
import type { ProjectRecord } from '../shared/records';
import { relationshipsFor,relationshipLabels } from '../shared/relationships';
import RouteLink from './RouteLink';
export function RecordLinks({records,id,onSelect,hrefFor}:{records:ProjectRecord[];id:string;onSelect:(id:string)=>void;hrefFor:(id:string)=>string}){
  const links=relationshipsFor(records,id);
  return <div className="record-links">
    <div className="eyebrow"><Link2 size={13}/> OUTGOING · {links.outgoing.length}</div>
    {links.outgoing.map(link=>link.record?<RouteLink className="linked-row" key={link.key} href={hrefFor(link.id)} onNavigate={()=>onSelect(link.id)}><span>{link.record.title}<small>{relationshipLabels[link.kind].outgoing} · {link.record.type}</small></span><ArrowUpRight size={13}/></RouteLink>:<p key={link.key} className="missing-link"><AlertTriangle size={13}/> {relationshipLabels[link.kind].outgoing}: {link.id}</p>)}
    {!links.outgoing.length&&<p className="link-empty">No outgoing links.</p>}
    <div className="eyebrow"><ArrowLeft size={13}/> BACKLINKS · {links.incoming.length}</div>
    {links.incoming.map(link=><RouteLink className="linked-row" key={link.key} href={hrefFor(link.id)} onNavigate={()=>onSelect(link.id)}><span>{link.record.title}<small>{relationshipLabels[link.kind].incoming} · {link.record.type}</small></span><ArrowUpRight size={13}/></RouteLink>)}
    {!links.incoming.length&&<p className="link-empty">No incoming links.</p>}
  </div>;
}

import { ArrowUpRight, ArrowLeft, Link2, AlertTriangle } from 'lucide-react';
import type { ProjectRecord } from '../shared/records';
import { relationshipsFor } from '../shared/views';
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

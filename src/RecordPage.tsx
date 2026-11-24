import { lazy,Suspense } from 'react';
import { ArrowRight, Pencil, ListChecks } from 'lucide-react';
import type { ProjectRecord } from '../shared/records';
import type { GitHistory } from '../shared/delivery';
import { relationshipsFor } from '../shared/relationships';
import { RecordLinks } from './RecordLinks';
import { RecordEvidence } from './DeliveryEvidence';
import Status from './Status';
import { draftStorage } from './draftStorage';
import RouteLink from './RouteLink';
const MarkdownBody=lazy(()=>import('./Markdown'));
export default function RecordPage({projectId,record,records,unavailable,onOpen,hrefFor,onEdit,repository,history,historyLoading,historyError,onRefresh}:{projectId:string;record:ProjectRecord;records:ProjectRecord[];unavailable:boolean;onOpen:(id:string)=>void;hrefFor:(id:string)=>string;onEdit:()=>void;repository:boolean;history:GitHistory|undefined;historyLoading:boolean;historyError:boolean;onRefresh:()=>void}){
  const links=relationshipsFor(records,record.id);
  const tests=[...new Map([...links.outgoing,...links.incoming].flatMap(link=>link.record?.type==='Test'&&link.id!==record.id?[[link.id,link.record] as const]:[])).values()];
  const recovery=draftStorage.read(projectId,record.id);
  return <article className="record-page">
    <header className="record-page-heading"><div><div className="eyebrow">{record.type} / {record.id}</div><h1>{record.title}</h1><div className="record-page-meta"><Status value={record.status}/><span>{record.priority} priority</span>{record.tags.map((tag,i)=><span className="record-tag" key={tag+':'+i}>{tag}</span>)}</div></div><button className="primary" onClick={onEdit} disabled={unavailable}><Pencil size={15}/>{recovery.state==='available'?'Resume draft':record.type==='Test'?'Edit checklist':'Edit record'}</button></header>
    {unavailable&&<p role="alert" className="warning">The record is unavailable on disk. This is the last loaded version.</p>}
    {recovery.state==='available'&&<p className="record-recovery-note">An unsaved recovery draft exists. The page below shows the saved record.</p>}
    {tests.length>0&&<section className="record-review" aria-label="Linked acceptance tests"><div className="eyebrow"><ListChecks size={16}/> VERIFICATION &amp; ACCEPTANCE</div><h2>Linked tests</h2><p>Open a test to review its instructions and recorded results. Linked tests do not imply acceptance.</p>{tests.map(test=><RouteLink key={test.id} className="record-review-link" href={hrefFor(test.id)} onNavigate={()=>onOpen(test.id)}><span><strong>{test.title}</strong><small>{test.status} · {test.priority} priority</small></span><ArrowRight size={18}/></RouteLink>)}</section>}
    <section className="record-reading" aria-label={record.type==='Test'?'Test instructions':'Record content'}><h2>{record.type==='Test'?'Test instructions and results':record.type==='Document'?'Document':'Details'}</h2><Suspense fallback={<p role="status" className="markdown-loading">Loading record content…</p>}><MarkdownBody body={record.body}/></Suspense>{record.type==='Test'&&<p className="overview-note">Checklist boxes are read-only in this view. Use Edit checklist to record observed results.</p>}</section>
    <section className="record-reading"><h2>Relationships</h2><RecordLinks records={records} id={record.id} onSelect={onOpen} hrefFor={hrefFor}/></section>
    {repository&&<section className="record-reading"><h2>Implementation evidence</h2><RecordEvidence record={record} history={history} loading={historyLoading} error={historyError} onRefresh={onRefresh}/></section>}
  </article>;
}

import { lazy,Suspense,useLayoutEffect,useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { acceptanceDefinition,currentAcceptance,isAcceptanceTest } from '../shared/acceptance';
import { api } from './api';
import AcceptanceWorkspace from './AcceptanceWorkspace';
import { ArrowRight, Pencil, ListChecks, Trash2 } from 'lucide-react';
import type { ProjectRecord } from '../shared/records';
import type { GitHistory } from '../shared/delivery';
import { relationshipsFor } from '../shared/relationships';
import { RecordLinks } from './RecordLinks';
import { RecordEvidence } from './DeliveryEvidence';
import Status from './Status';
import { draftStorage } from './draftStorage';
import RouteLink from './RouteLink';
const MarkdownBody=lazy(()=>import('./Markdown'));
function ReviewLink({projectId,test,head,href,onOpen}:{projectId:string;test:ProjectRecord;head:string|undefined;href:string;onOpen:()=>void}){
  const parsed=acceptanceDefinition(test);
  const query=useQuery({queryKey:['acceptance-runs',projectId,test.id],queryFn:()=>api.acceptanceRuns(projectId,test.id),enabled:parsed.state==='available'});
  const run=query.data?.runs.find(r=>currentAcceptance(r,head,test.revision)&&r.decision==='open')||query.data?.runs.find(r=>currentAcceptance(r,head,test.revision));
  const total=parsed.state==='available'?parsed.definition.groups.reduce((n,g)=>n+g.cases.length,0):0;
  const action=parsed.state!=='available'?'Open test':query.isPending||query.isError||!head?'Open review':run?.decision==='open'?'Resume acceptance':run?'View review':'Start acceptance';
  return <RouteLink className="record-review-link acceptance-entry" href={href} onNavigate={onOpen}><span><strong>{test.title}</strong><small>{run?run.progress.passed+' / '+run.progress.total+' cases passed · '+(run.decision==='open'?'Review in progress':run.decision):total?total+' cases · '+(query.isError?'Run history unavailable':query.isPending?'Reading review history…':'No current review recorded'):test.status+' · '+test.priority+' priority'}</small></span><span className="review-entry-action">{action}<ArrowRight size={16}/></span></RouteLink>;
}
export default function RecordPage({projectId,record,records,unavailable,onOpen,hrefFor,onEdit,onBusyChange,busy,onTrash,trashError,repository,history,historyLoading,historyError,onRefresh}:{projectId:string;record:ProjectRecord;records:ProjectRecord[];unavailable:boolean;onOpen:(id:string)=>void;hrefFor:(id:string)=>string;onEdit:()=>void;onBusyChange:(busy:boolean)=>void;busy:boolean;onTrash:()=>void;trashError?:string;repository:boolean;history:GitHistory|undefined;historyLoading:boolean;historyError:boolean;onRefresh:()=>void}){
  const links=relationshipsFor(records,record.id);
  const tests=[...new Map([...links.outgoing,...links.incoming].flatMap(link=>link.record?.type==='Test'&&link.id!==record.id?[[link.id,link.record] as const]:[])).values()];
  const recovery=draftStorage.read(projectId,record.id);
  const parsed=acceptanceDefinition(record);
  const head=!historyError&&history?.state==='available'?history.head:undefined;
  // Retain the workspace and unsaved observations if the definition is externally invalidated.
  const [lastDefinition,setLastDefinition]=useState(()=>parsed.state==='available'?parsed.definition:undefined);
  useLayoutEffect(()=>{if(parsed.state==='available')setLastDefinition(parsed.definition);},[record.revision]);
  const definition=parsed.state==='available'?parsed.definition:lastDefinition;
  const reviewHead=!unavailable&&parsed.state==='available'?head:undefined;
  const nativeReview=repository&&!!definition;
  return <article className="record-page">
    <header className="record-page-heading"><div><div className="eyebrow">{record.type} / {record.id}</div><h1>{record.title}</h1><div className="record-page-meta"><Status value={record.status}/><span>{record.priority} priority</span>{record.tags.map((tag,i)=><span className="record-tag" key={tag+':'+i}>{tag}</span>)}</div></div><div className="record-page-actions"><button className={nativeReview?'secondary':'primary'} onClick={onEdit} disabled={unavailable||busy}><Pencil size={15}/>{recovery.state==='available'?'Resume draft':isAcceptanceTest(record)?'Edit test definition':'Edit record'}</button><button type="button" className="secondary record-trash-action" disabled={unavailable||busy} onClick={onTrash}><Trash2 size={15}/> Move to trash</button></div></header>
    {trashError&&<p role="alert" className="warning">{trashError}</p>}
    {(record.createdAt||record.updatedAt)&&<div className="record-dates">{record.createdAt&&<span>Created <time dateTime={record.createdAt}>{new Date(record.createdAt).toLocaleString()}</time></span>}{record.updatedAt&&<span>Last saved <time dateTime={record.updatedAt}>{new Date(record.updatedAt).toLocaleString()}</time></span>}</div>}
    {unavailable&&<p role="alert" className="warning">The record is unavailable on disk. This is the last loaded version.</p>}
    {recovery.state==='available'&&<p className="record-recovery-note">An unsaved recovery draft exists. The page below shows the saved record.</p>}
    {tests.length>0&&<section className="record-review" aria-label="Linked acceptance tests"><div className="eyebrow"><ListChecks size={16}/> VERIFICATION &amp; ACCEPTANCE</div><h2>Linked tests</h2><p>Start or resume a linked review. Results remain separate from implementation status.</p>{tests.map(test=><ReviewLink key={test.id} projectId={projectId} test={test} head={head} href={hrefFor(test.id)} onOpen={()=>onOpen(test.id)}/>)}</section>}
    {parsed.state==='invalid'&&<p className="warning" role="alert">{parsed.message} Use Edit test definition to repair the case format.</p>}
    {parsed.state==='available'&&!repository&&<p className="overview-note">Revision-bound review runs require an independent Git repository. The test definition remains readable.</p>}
    {nativeReview&&definition?<AcceptanceWorkspace key={record.id} projectId={projectId} record={record} definition={definition} head={reviewHead} onBusyChange={onBusyChange}/>:<section className="record-reading" aria-label={record.type==='Test'?'Test instructions':'Record content'}><h2>{record.type==='Test'?'Test instructions and results':record.type==='Document'?'Document':'Details'}</h2><Suspense fallback={<p role="status" className="markdown-loading">Loading record content…</p>}><MarkdownBody body={record.body}/></Suspense>{record.type==='Test'&&<p className="overview-note">Markdown checkboxes are read-only. Native execution is available for supported acceptance definitions in Git repositories.</p>}</section>}
    <section className="record-reading"><h2>Relationships</h2><RecordLinks records={records} id={record.id} onSelect={onOpen} hrefFor={hrefFor}/></section>
    {repository&&<section className="record-reading"><h2>Implementation evidence</h2><RecordEvidence record={record} history={history} loading={historyLoading} error={historyError} onRefresh={onRefresh}/></section>}
  </article>;
}

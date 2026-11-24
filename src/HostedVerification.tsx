import { useQuery } from '@tanstack/react-query';
import { GitBranch,RefreshCw } from 'lucide-react';
import { api } from './api';
import { hostedRevisionRelation,hostedRunOutcome,hostedRunUrl } from '../shared/hostedVerification';
import type { GitHistory } from '../shared/delivery';
import HostedJobDetails from './HostedJobDetails';

export default function HostedVerification({projectId,repository,history}:{projectId:string;repository?:string;history:GitHistory|undefined}){
 const query=useQuery({queryKey:['hosted-verification',projectId,repository],queryFn:()=>api.hostedVerification(projectId),enabled:false,retry:false});
 const data=query.isError?undefined:query.data;
 const head=history?.state==='available'?history.head:undefined;
 return <section className="local-verification overview-section" aria-label="Hosted verification">
  <div className="overview-section-head"><div><span className="eyebrow"><GitBranch size={14}/> GITHUB ACTIONS</span><h3>Hosted workflow evidence</h3></div>{repository&&<button className="secondary" disabled={query.isFetching} onClick={()=>{void query.refetch();}}><RefreshCw size={14}/> {data?'Refresh GitHub runs':'Load GitHub runs'}</button>}</div>
  {!repository?<p className="overview-note">No public GitHub repository configured. Set githubRepository in the project registry to enable explicit read-only lookup.</p>:<>
   <p className="overview-note">{repository} · Public anonymous metadata only. Refresh may reuse a 30-second observation.</p>
   {query.isFetching?<p role="status">Reading GitHub workflow runs…</p>:query.isError?<p role="alert" className="warning">Could not refresh GitHub workflow metadata.</p>:!data?<p className="overview-note">Nothing loaded. GitHub is contacted only when you request a lookup.</p>:data.state!=='available'?<p role="status" className="overview-note">{data.message}</p>:<>
    <p className="overview-note" role="status">{data.runs.length} of {data.total} reported runs · Observed {new Date(data.observedAt).toLocaleString()}</p>
    <div className="hosted-run-list">{data.runs.map(run=>{
     const outcome=hostedRunOutcome(run),relation=hostedRevisionRelation(run,head);
     return <article className="hosted-run" key={run.id}><div className="hosted-run-heading"><a href={hostedRunUrl(data.repository,run.id)} target="_blank" rel="noopener noreferrer">{run.name} · #{run.id}</a><strong className={outcome==='passed'?'check-passed':outcome==='not-passed'?'check-failed':''}>{run.status==='completed'?(run.conclusion??'No conclusion'):run.status}</strong></div>
      <p className="overview-note">{run.event} · {run.branch??'No branch'} · Attempt {run.attempt} · {new Date(run.updatedAt).toLocaleString()}</p>
      <p className="overview-note">Reported head <code>{run.head}</code> · {relation==='pr-head'?'PR head matches local HEAD; checkout revision not established':relation==='reported-head'?'Reported head matches local HEAD':relation==='different'?'Different reported revision':'Local HEAD unavailable'}</p>
      {run.pullRequests.length>0&&<p className="overview-note">Associated pull requests: {run.pullRequests.map(n=><a key={n} href={'https://github.com/'+data.repository+'/pull/'+n} target="_blank" rel="noopener noreferrer"> #{n} </a>)}</p>}
      <HostedJobDetails projectId={projectId} repository={data.repository} run={run}/>
     </article>;
    })}</div>{!data.runs.length&&<p className="overview-note">GitHub returned no workflow runs.</p>}
   </>}
   <p className="overview-note">Run status is reported by GitHub, not a verified job matrix or artifact report. PR merge checkout, local cleanliness, record scope and human acceptance are separate. No authored status changes.</p>
  </>}
 </section>;
}

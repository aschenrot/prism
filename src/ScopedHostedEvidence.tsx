import { useQuery } from '@tanstack/react-query';
import { api } from './api';
import type { ProjectRecord } from '../shared/records';
import { matchingPullRuns,pullRequestUrl,hostedRunUrl,type PullReference,type HostedVerificationResult } from '../shared/hostedVerification';
import HostedJobDetails from './HostedJobDetails';
function PullEvidence({projectId,recordId,repository,reference,observed,unavailable}:{projectId:string;recordId:string;repository?:string;reference:PullReference;observed:HostedVerificationResult|undefined;unavailable:boolean}){
 const matches=repository?.toLowerCase()===reference.repository.toLowerCase();
 const query=useQuery({queryKey:['hosted-pull',projectId,recordId,reference.repository,reference.number],queryFn:()=>api.hostedPull(projectId,recordId,reference.number),enabled:false,retry:false});
 const data=matches&&!unavailable&&!query.isError?query.data:undefined;
 const runs=matches&&observed?.state==='available'?matchingPullRuns(reference,observed.repository,observed.runs):[];
 return <article className="hosted-run"><div className="hosted-run-heading"><a href={pullRequestUrl(reference)} target="_blank" rel="noopener noreferrer">{reference.repository} #{reference.number}</a>
 {matches&&!unavailable&&<button className="secondary" type="button" disabled={query.isFetching} onClick={()=>{void query.refetch();}}>{data?'Refresh PR':'Load PR'}</button>}</div>
 {!matches?<p className="overview-note">Reference does not match the configured repository. No remote lookup.</p>:unavailable?<p className="overview-note">Record unavailable on disk; lookup disabled.</p>:query.isFetching?<p role="status">Reading pull request…</p>:query.isError?<p role="alert">Could not load pull request.</p>:data?.state==='available'?<>
 <strong>{data.pull.title}</strong><p className="overview-note">{data.pull.merged?'Merged':data.pull.state==='closed'?'Closed':data.pull.draft?'Draft':'Open'} · Observed {new Date(data.observedAt).toLocaleString()}</p>
 <p className="overview-note">PR head <code>{data.pull.head}</code> · Base <code>{data.pull.base.slice(0,12)}</code></p>
 </>:data?<p role="status" className="overview-note">{data.message}</p>:<p className="overview-note">Authored association; remote state not loaded.</p>}
 {matches&&observed?.state==='available'&&<div>{runs.length?runs.map(run=><div key={run.id} className="hosted-run"><div className="hosted-run-heading"><a href={hostedRunUrl(observed.repository,run.id)} target="_blank" rel="noopener noreferrer">{run.name} · #{run.id}</a><strong>{run.status==='completed'?(run.conclusion??'No conclusion'):run.status}</strong></div><p className="overview-note">Reported head <code>{run.head.slice(0,12)}</code> · {data?.state==='available'&&data.pull.head===run.head?'Matches observed PR head':'Current PR head not established or differs'}</p><HostedJobDetails projectId={projectId} repository={observed.repository} run={run}/></div>):<p className="overview-note">No explicitly associated PR runs in this recent page. Older or unassociated runs may exist.</p>}</div>}
 </article>;
}
export default function ScopedHostedEvidence({projectId,repository,increment,unavailable}:{projectId:string;repository?:string;increment:ProjectRecord;unavailable:boolean}){
 const refs=increment.githubPullRequests??[];
 const query=useQuery({queryKey:['hosted-verification',projectId,repository],queryFn:()=>api.hostedVerification(projectId),enabled:false,retry:false});
 const observed=!unavailable&&!query.isError&&!query.isFetching?query.data:undefined;
 const canLoad=!unavailable&&refs.some(ref=>ref.repository.toLowerCase()===repository?.toLowerCase());
 return <section className="record-reading increment-panel" aria-label="Hosted delivery evidence"><div className="overview-section-head"><div><span className="eyebrow">HOSTED DELIVERY</span><h2>Pull requests and checks</h2></div>{canLoad&&<button className="secondary" type="button" disabled={query.isFetching} onClick={()=>{void query.refetch();}}>{observed?'Refresh associated runs':'Load associated runs'}</button>}</div>
 {!refs.length?<p className="overview-note">No authored pull request references. Add repository-qualified githubPullRequests metadata to this increment's Markdown frontmatter.</p>:<>
 {query.isFetching?<p role="status">Reading recent workflow runs…</p>:query.isError?<p role="alert">Could not load recent workflow runs.</p>:observed&&observed.state!=='available'?<p role="status">{observed.message}</p>:observed?.state==='available'?<p className="overview-note">Recent page: {observed.runs.length} of {observed.total} reported runs · Observed {new Date(observed.observedAt).toLocaleString()}</p>:null}
 {refs.map(reference=><PullEvidence key={reference.repository+':'+reference.number} projectId={projectId} recordId={increment.id} repository={repository} reference={reference} observed={observed} unavailable={unavailable}/>)}
 </>}
 <p className="overview-note">Explicit authored references only. No inferred association, matrix eligibility, completion or human acceptance.</p>
 </section>;
}

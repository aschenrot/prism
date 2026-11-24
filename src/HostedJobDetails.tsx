import { useQuery } from '@tanstack/react-query';
import type { HostedRun } from '../shared/hostedVerification';
import { api } from './api';
export default function HostedJobDetails({projectId,repository,run}:{projectId:string;repository:string;run:HostedRun}){
 const query=useQuery({queryKey:['hosted-jobs',projectId,repository,run.id,run.attempt],queryFn:()=>api.hostedJobs(projectId,run.id,run.attempt),enabled:false,retry:false});
 const data=query.isError?undefined:query.data;
 return <div className="hosted-job-details"><button className="secondary" type="button" disabled={query.isFetching} onClick={()=>{void query.refetch();}}>{data?'Refresh jobs':'Load jobs'}</button>
 {query.isFetching?<p role="status">Reading jobs…</p>:query.isError?<p role="alert">Could not load jobs.</p>:data?.state==='available'?<>
 <p className="overview-note">{data.jobs.length} of {data.total} reported jobs · Attempt {data.attempt} · Observed {new Date(data.observedAt).toLocaleString()}</p>
 {data.jobs.map(job=><div className="increment-gate" key={job.id}><div><a href={'https://github.com/'+repository+'/actions/runs/'+run.id+'/job/'+job.id} target="_blank" rel="noopener noreferrer">{job.name}</a><p className="overview-note">Reported head <code>{job.reportedHead.slice(0,12)}</code></p></div><strong className={job.status==='completed'&&job.conclusion==='success'?'check-passed':''}>{job.status==='completed'?(job.conclusion??'No conclusion'):job.status}</strong></div>)}
 {data.total>data.jobs.length&&<p className="overview-note">Partial job list; no complete matrix conclusion.</p>}
 <p className="overview-note">Job status and reported head are provider metadata, not actual checkout/artifact verification.</p>
 </>:data?<p role="status" className="overview-note">{data.message}</p>:null}
 </div>;
}

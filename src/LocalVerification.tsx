import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, Circle, AlertTriangle, RefreshCw } from 'lucide-react';
import { api } from './api';
import { verificationState } from '../shared/verification';
import type { GitHistory } from '../shared/delivery';
const labels={install:'Locked dependency install',typecheck:'TypeScript verification',test:'Automated tests',build:'Production build',audit:'Full dependency audit', 'audit-production':'Production dependency audit'};
export default function LocalVerification({projectId,history}:{projectId:string;history:GitHistory|undefined}){
  const query=useQuery({queryKey:['verification',projectId],queryFn:()=>api.verification(projectId),refetchInterval:10000,retry:false});
  const data=query.data;
  const report=data?.state==='available'?data.report:undefined;
  const state=report?verificationState(report,history?.state==='available'?history.head:undefined):undefined;
  const message=state==='passed'?'Automated checks passed for recorded clean HEAD':state==='not-passed'?'One or more checks did not pass':state==='historical'?'Historical evidence — HEAD has changed':state==='diagnostic'?'Diagnostic only — revision or working tree was not clean':state==='unknown'?'Cannot compare with current HEAD':'';
  return <section className="local-verification overview-section" aria-label="Local verification"><div className="overview-section-head"><div><span className="eyebrow">LOCAL QUALITY GATE</span><h3>Verification evidence</h3></div><button className="secondary" disabled={query.isFetching} onClick={()=>{void query.refetch();}}><RefreshCw size={14}/> Refresh</button></div>
    {query.isError?<p role="alert" className="warning">Could not refresh the local report.</p>:report?<><p className={'verification-result '+(state==='passed'?'check-passed':'')}>{message}</p><p className="overview-note">Revision <code>{report.revision.slice(0,12)}</code> · {new Date(report.finishedAt).toLocaleString()}<br/>{report.environment.platform} / {report.environment.arch} · Node {report.environment.node} · npm {report.environment.npm}</p>
    {report.steps.map(step=><div className="verification-step" key={step.id}>{step.status==='passed'?<CheckCircle2 size={16} className="check-passed"/>:step.status==='failed'?<AlertTriangle size={16} className="check-failed"/>:<Circle size={16}/>}<span>{labels[step.id]}</span><small>{step.status}</small></div>)}
    <p className="overview-note">Local report, not independently attested. Cleanliness was observed at the start and end of the run only; later uncommitted changes are not checked here. Audit failure may also indicate a registry/network error. Manual acceptance remains separate.</p></>:<p className="overview-note">{query.isPending?'Reading local verification…':data?.message||'No report available.'} {data?.state==='unavailable'&&<>Run <code>npm run verify</code> in the Prism repository.</>}</p>}
  </section>;
}

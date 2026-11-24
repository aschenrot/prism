import { useQueries,useQuery } from '@tanstack/react-query';
import { Package,ArrowRight,ShieldCheck,ListChecks } from 'lucide-react';
import type { ProjectRecord } from '../shared/records';
import { scopeFor,scopeReview,milestoneIncrements } from '../shared/increments';
import { linkedCommits,type GitHistory } from '../shared/delivery';
import { verificationState } from '../shared/verification';
import { browserVerificationState } from '../shared/browserVerification';
import { acceptanceDefinition } from '../shared/acceptance';
import { api } from './api';
import RouteLink from './RouteLink';
import Status from './Status';
const gateLabel=(state:string)=>state==='passed'?'Passed for recorded clean HEAD':state==='historical'?'Historical · HEAD changed':state==='diagnostic'?'Diagnostic only':state==='not-passed'?'Not passed':state==='unknown'?'Cannot compare revision':'Unavailable';
type LinkProps={onOpen:(id:string)=>void;hrefFor:(id:string)=>string};
export function MilestoneScope({milestone,records,onOpen,hrefFor}:{milestone:ProjectRecord;records:ProjectRecord[]}&LinkProps){
 const increments=milestoneIncrements(milestone,records);
 return <section className="record-reading increment-panel"><div className="eyebrow"><Package size={15}/> DELIVERY SCOPE</div><h2>Delivery increments</h2>{!increments.length?<p className="overview-note">No explicit increments. Add a Contains relationship to an Increment to define scope.</p>:increments.map(r=>{const scope=scopeFor(r,records);return <RouteLink className="increment-row" key={r.id} href={hrefFor(r.id)} onNavigate={()=>onOpen(r.id)}><div><strong>{r.title}</strong><small>{scope.ready} / {scope.tasks.length} tasks marked Ready · {scope.tests.length} linked tests</small></div><Status value={r.status}/><ArrowRight size={15}/></RouteLink>;})}</section>;
}
export default function IncrementPanel({projectId,increment,records,history,repository,onOpen,hrefFor,incomplete}:{projectId:string;increment:ProjectRecord;records:ProjectRecord[];history:GitHistory|undefined;repository:boolean;incomplete:boolean}&LinkProps){
 const scope=scopeFor(increment,records,history),head=history?.state==='available'?history.head:undefined;
 const npm=useQuery({queryKey:['verification',projectId],queryFn:()=>api.verification(projectId),enabled:repository,refetchInterval:10000,retry:false});
 const browser=useQuery({queryKey:['browser-verification',projectId],queryFn:()=>api.browserVerification(projectId),enabled:repository,refetchInterval:10000,retry:false});
 const runs=useQueries({queries:scope.tests.map(test=>({queryKey:['acceptance-runs',projectId,test.id],queryFn:()=>api.acceptanceRuns(projectId,test.id),enabled:repository&&acceptanceDefinition(test).state==='available',refetchInterval:10000,retry:false}))});
 const reviews=scope.tests.map((test,i)=>scopeReview(test,head,runs[i]?.isError?undefined:runs[i]?.data));
 const npmReport=!npm.isError&&npm.data?.state==='available'?npm.data.report:undefined,browserReport=!browser.isError&&browser.data?.state==='available'?browser.data.report:undefined;
 const npmState=npmReport?verificationState(npmReport,head):'unavailable',browserState=browserReport?browserVerificationState(browserReport,head):'unavailable';
 const accepted=reviews.filter(r=>r.state==='accepted').length;
 return <section className="record-reading increment-panel" aria-label="Delivery increment scope">
 <div className="eyebrow"><Package size={15}/> DELIVERY INCREMENT</div><h2>Scope and evidence</h2>
 {scope.milestones.length>1&&<p className="overview-note">This increment is explicitly linked from multiple milestones; review scope overlap.</p>}
 {scope.milestones.length>0&&<div className="increment-parents">{scope.milestones.map(r=><RouteLink key={r.id} className="text-action" href={hrefFor(r.id)} onNavigate={()=>onOpen(r.id)}>{r.title}<ArrowRight size={13}/></RouteLink>)}</div>}
 <div className="increment-metrics"><div><small>Authored task status</small><strong>{scope.ready} / {scope.tasks.length}</strong><span>Marked Ready</span></div><div><small>Implementation evidence</small><strong>{repository&&history?.state==='available'?scope.linked+' / '+scope.tasks.length:'—'}</strong><span>Tasks with linked commits</span></div><div><small>Current acceptance</small><strong>{repository&&head?accepted+' / '+scope.tests.length:'—'}</strong><span>Tests with accepted current run</span></div></div>
 {(scope.issues.length>0||incomplete)&&<div className="warning" role="status">{incomplete&&<p>Some project records could not be read; scope may be incomplete.</p>}{scope.issues.map(issue=><p key={issue.id}>{issue.id}: {issue.message}</p>)}</div>}
 <h3>Implementation scope</h3>{scope.tasks.length?scope.tasks.map(r=><RouteLink key={r.id} className="increment-row" href={hrefFor(r.id)} onNavigate={()=>onOpen(r.id)}><div><strong>{r.title}</strong><small>{repository&&history?.state==='available'?linkedCommits(r,history).length+' linked commits':'Implementation evidence unavailable'}</small></div><Status value={r.status}/><ArrowRight size={15}/></RouteLink>):<p className="overview-note">No tasks in scope. Add Contains relationships to tasks.</p>}
 {repository&&<><h3><ShieldCheck size={16}/> Automated gates</h3><div className="increment-gate"><span>Local npm verification</span><strong className={npmState==='passed'?'check-passed':''}>{npm.isPending?'Reading…':gateLabel(npmState)}</strong></div>{npmReport&&<p className="overview-note">Revision <code>{npmReport.revision.slice(0,12)}</code></p>}
 <div className="increment-gate"><span>Browser regression</span><strong className={browserState==='passed'?'check-passed':''}>{browser.isPending?'Reading…':gateLabel(browserState)}</strong></div>{browserReport&&<p className="overview-note">{browserReport.stats?browserReport.stats.passed+' passed · '+browserReport.stats.failed+' failed · '+browserReport.stats.skipped+' skipped · '+browserReport.stats.flaky+' flaky · ':''}Revision <code>{browserReport.revision.slice(0,12)}</code></p>}
 <p className="overview-note">Reports are project-wide and refer to recorded HEAD and observed cleanliness, not proof of individual task completion or current uncommitted changes.</p></>}
 <h3><ListChecks size={16}/> Acceptance scope</h3>{scope.tests.length?scope.tests.map((r,i)=><RouteLink key={r.id} className="increment-row" href={hrefFor(r.id)} onNavigate={()=>onOpen(r.id)}><div><strong>{r.title}</strong><small>{!repository?'Revision-bound execution requires a repository':runs[i]?.isPending&&acceptanceDefinition(r).state==='available'?'Reading review history…':reviews[i].message}</small></div><ArrowRight size={15}/></RouteLink>):<p className="overview-note">No acceptance tests in scope. Add Contains relationships to Test records.</p>}
 <p className="overview-note">{increment.status==='Ready'?'Authored status is Ready; current evidence may differ from historical integration evidence. ':''}Links do not prove implementation completeness. Final acceptance and integration require an explicit decision. PR references remain authored context, not live GitHub status.</p>
 </section>;
}

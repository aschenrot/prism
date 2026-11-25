import { lazy,Suspense,useLayoutEffect,useRef,useState,type ReactNode } from 'react';
import { useMutation,useQuery,useQueryClient } from '@tanstack/react-query';
import { ArrowLeft,ArrowRight,CheckCircle2,Circle,XCircle,AlertTriangle,Download,Plus,RotateCw,ChevronRight } from 'lucide-react';
import { acceptanceOutcomes,acceptanceProgress,currentAcceptance,type AcceptanceDefinition,type AcceptanceOutcome,type AcceptanceRun,type UpdateAcceptance } from '../shared/acceptance';
import type { ProjectRecord } from '../shared/records';
import { verificationState } from '../shared/verification';
import { api } from './api';
import ReviewHandoff from './ReviewHandoff';
const Markdown=lazy(()=>import('./Markdown'));
function Reading({body}:{body:string}){return <Suspense fallback={<p role="status" className="overview-note">Loading instructions…</p>}><Markdown body={body}/></Suspense>;}
function OutcomeIcon({outcome}:{outcome:AcceptanceOutcome}){
  const Icon=outcome==='Passed'?CheckCircle2:outcome==='Failed'?XCircle:outcome==='Blocked'?AlertTriangle:Circle;
  return <Icon size={17} className={'outcome-icon outcome-'+outcome.toLowerCase()} aria-label={outcome}/>;
}
function Progress({run}:{run:AcceptanceRun}){
  const p=acceptanceProgress(run);
  return <div className="acceptance-progress"><div className="acceptance-progress-top"><strong>{p.passed}<small> / {p.total}</small></strong><span>cases passed</span></div><div className="acceptance-progress-track" role="progressbar" aria-label="Cases passed" aria-valuemin={0} aria-valuemax={p.total} aria-valuenow={p.passed}><span style={{width:(p.passed/p.total*100)+'%'}}/></div><div className="acceptance-counts"><span className="outcome-passed">{p.passed} passed</span><span className="outcome-failed">{p.failed} failed</span><span className="outcome-blocked">{p.blocked} blocked</span><span>{p.pending} pending</span></div></div>;
}
function exportRun(run:AcceptanceRun){
  const url=URL.createObjectURL(new Blob([JSON.stringify(run,null,2)+'\n'],{type:'application/json'}));
  const link=document.createElement('a');link.href=url;link.download='prism-acceptance-'+run.testId+'-'+run.id+'.json';document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
type CaseDraft={outcome:AcceptanceOutcome;notes:string};
function resultFor(run:AcceptanceRun,id:string):CaseDraft{
  const result=run.results.find(r=>r.caseId===id);return {outcome:result?.outcome||'Pending',notes:result?.notes||''};
}
function casePreference(project:string,run:string){return 'prism:acceptance-case:v1:'+project+':'+run;}
function firstCase(run:AcceptanceRun,project:string){
  const cases=run.definition.groups.flatMap(g=>g.cases);
  try{const saved=localStorage.getItem(casePreference(project,run.id));if(saved&&cases.some(c=>c.id===saved))return saved;}catch{/* default */}
  return cases.find(c=>resultFor(run,c.id).outcome!=='Passed')?.id||cases[0].id;
}
function RunPanel({initial,projectId,head,record,onBusyChange,onSaved,runPicker}:{initial:AcceptanceRun;runPicker:ReactNode;projectId:string;head:string|undefined;record:ProjectRecord;onBusyChange:(busy:boolean)=>void;onSaved:(run:AcceptanceRun)=>void}){
  const [run,setRun]=useState(initial);
  const [active,setActive]=useState(()=>firstCase(run,projectId));
  const [draft,setDraft]=useState(()=>resultFor(run,active));
  const caseHeading=useRef<HTMLHeadingElement>(null),previousCase=useRef(active);
  useLayoutEffect(()=>{if(previousCase.current===active)return;previousCase.current=active;const heading=caseHeading.current;if(!heading)return;heading.focus({preventScroll:true});const rect=heading.getBoundingClientRect();if(rect.top<76||rect.bottom>window.innerHeight)heading.scrollIntoView({block:'start'});},[active]);
  const [decisionNotes,setDecisionNotes]=useState('');
  const [showDecision,setShowDecision]=useState(false);
  const cases=run.definition.groups.flatMap(g=>g.cases.map(c=>({...c,group:g})));
  const index=cases.findIndex(c=>c.id===active),item=cases[index]||cases[0];
  const original=resultFor(run,active);
  const dirty=draft.outcome!==original.outcome||draft.notes!==original.notes;
  const current=currentAcceptance(run,head,record.revision);
  const editable=current&&run.decision==='open';
  const mutation=useMutation({mutationFn:({input,nextCase}:{input:UpdateAcceptance;nextCase?:string})=>api.updateAcceptance(projectId,run.testId,run.id,input),onSuccess:(next,{input,nextCase})=>{const id=nextCase||active;setRun(next);setActive(id);setDraft(resultFor(next,id));if(nextCase)try{localStorage.setItem(casePreference(projectId,run.id),id);}catch{/* optional */}if(input.action==='decision'){setDecisionNotes('');setShowDecision(false);}onSaved(next);}});
  const reloadRun=useMutation({mutationFn:()=>api.acceptanceRun(projectId,run.testId,run.id),onSuccess:next=>{const id=next.definition.groups.some(g=>g.cases.some(c=>c.id===active))?active:firstCase(next,projectId);setRun(next);setActive(id);setDraft(resultFor(next,id));setDecisionNotes('');setShowDecision(false);mutation.reset();onSaved(next);}});
  const saving=mutation.isPending||reloadRun.isPending;
  const busy=dirty||!!decisionNotes.trim()||saving;
  useLayoutEffect(()=>{onBusyChange(busy);},[busy,onBusyChange]);
  useLayoutEffect(()=>()=>onBusyChange(false),[onBusyChange]);
  useLayoutEffect(()=>{if(!busy)return;const warn=(e:BeforeUnloadEvent)=>{e.preventDefault();e.returnValue='';};window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn);},[busy]);
  const choose=(id:string)=>{if(busy||id===active)return;setActive(id);setDraft(resultFor(run,id));mutation.reset();try{localStorage.setItem(casePreference(projectId,run.id),id);}catch{/* optional preference */}};
  const progress=acceptanceProgress(run);
  const valid=draft.outcome!=='Failed'&&draft.outcome!=='Blocked'||!!draft.notes.trim();
  const savedReport=run.verification?verificationState(run.verification,run.testedRevision):undefined;
  return <section className="acceptance-run">
    {reloadRun.error&&<p className="warning" role="alert">Could not reload: {reloadRun.error.message}. Your current input is still here.</p>}
    {!current&&<p className="warning" role="status">Historical or unconfirmed revision. Results are read-only until the original Git HEAD and test definition are available. Start a new review for changed content.</p>}
    {run.decision!=='open'&&<div className="acceptance-final" role="status"><strong>{run.decision==='accepted'?'Manual acceptance recorded':'Changes requested'}</strong><p>{run.decisionNotes}</p><small>Finalized {new Date(run.updatedAt).toLocaleString()}. This is not a merge or release approval.</small></div>}
    <div className="acceptance-run-bar">
      <Progress run={run}/>
      <div className="acceptance-secondary-controls">
        <details className="acceptance-instructions acceptance-run-details"><summary><ChevronRight size={15} aria-hidden="true"/>Review details</summary><div className="acceptance-detail-body">{runPicker}
<div className="acceptance-run-context"><div><div className="eyebrow">RECORDED REVISION</div><code title={run.testedRevision}>{run.testedRevision.slice(0,12)}</code><p>{run.reviewer} · {run.environment}</p><small>Started {new Date(run.startedAt).toLocaleString()}</small></div><div className="acceptance-run-tools"><ReviewHandoff run={run} unsaved={busy}/><button className="secondary" disabled={busy} onClick={()=>exportRun(run)}><Download size={15}/> Export results</button><button className="secondary" disabled={saving} onClick={()=>{if(!busy||window.confirm('Discard unsaved case or decision edits and reload the stored review?'))reloadRun.mutate();}}><RotateCw size={14}/> Reload run</button></div></div>
<p className="overview-note">Recorded automated report: {savedReport==='passed'?'passed at this revision':savedReport||'not available'}. Results are reviewer observations; recorded HEAD does not attest to a clean runtime or working tree throughout testing.</p>
</div></details>
        <details className="acceptance-instructions"><summary><ChevronRight size={15} aria-hidden="true"/>Setup &amp; safety</summary><div className="acceptance-detail-body"><Reading body={run.definition.instructions}/></div></details>
      </div>
    </div>
    <div className="acceptance-layout">
      <nav className="acceptance-cases" aria-label="Acceptance cases">
        {run.definition.groups.map(group=>{const passed=group.cases.filter(c=>resultFor(run,c.id).outcome==='Passed').length;return <section key={group.id}><div className="acceptance-group-title"><strong>{group.title}</strong><span>{passed}/{group.cases.length}</span></div>{group.cases.map(c=><button key={c.id} type="button" className={'acceptance-case-row'+(active===c.id?' active':'')} aria-current={active===c.id?'step':undefined} disabled={busy&&active!==c.id} onClick={()=>choose(c.id)}><OutcomeIcon outcome={resultFor(run,c.id).outcome}/><span><small>{c.id}</small>{c.title}</span></button>)}</section>;})}
      </nav>
      <div className="acceptance-case-content" key={active}>
        <div className="acceptance-case-header"><div><div className="eyebrow">{item.id} · CASE {index+1} OF {cases.length}</div><h2 ref={caseHeading} tabIndex={-1}>{item.title}</h2></div><span className={'acceptance-result-pill outcome-'+original.outcome.toLowerCase()}><OutcomeIcon outcome={original.outcome}/>{original.outcome}</span></div>
        <div className="acceptance-case-body"><div className="acceptance-case-instructions">
        {item.group.setup&&<div className="acceptance-setup"><h3>Setup</h3><Reading body={item.group.setup}/></div>}
        <section className="acceptance-action"><h3>What to do</h3><Reading body={item.action}/></section>
        <section className="acceptance-expected"><h3>Expected result</h3><Reading body={item.expected}/></section>
        </div>
        <form className="acceptance-result-form" onSubmit={e=>{e.preventDefault();if(editable&&dirty&&valid&&!saving)mutation.mutate({input:{action:'case',expectedRevision:run.revision,caseId:active,...draft}});}}>
          <fieldset disabled={!editable||saving}><legend>Observed result</legend><div className="acceptance-outcomes">{acceptanceOutcomes.map(outcome=><label key={outcome} className={draft.outcome===outcome?'chosen':''}><input type="radio" name="case-outcome" value={outcome} checked={draft.outcome===outcome} onChange={()=>setDraft(d=>({...d,outcome}))}/><OutcomeIcon outcome={outcome}/>{outcome}</label>)}</div><label className="acceptance-notes">Observations {draft.outcome==='Failed'||draft.outcome==='Blocked'?'(required)':'(optional)'}<textarea rows={3} maxLength={4000} value={draft.notes} placeholder="What actually happened? Include details for failures or blocked checks." onChange={e=>setDraft(d=>({...d,notes:e.target.value}))}/></label></fieldset>
          {mutation.error&&<p className="warning" role="alert">{mutation.error.message} Your unsaved input is still here.</p>}
          {dirty&&<p className="overview-note" role="status">Save or discard this case edit before changing pages or cases.</p>}
          <div className="acceptance-case-actions"><div className="acceptance-step-navigation"><button type="button" className="secondary" disabled={busy||index===0} onClick={()=>choose(cases[index-1].id)}><ArrowLeft size={15}/> Previous</button><button type="button" className="secondary" disabled={busy||index===cases.length-1} onClick={()=>choose(cases[index+1].id)}>Next <ArrowRight size={15}/></button>{dirty&&<button type="button" className="secondary acceptance-discard" disabled={saving} onClick={()=>{setDraft(original);mutation.reset();}}>Discard edit</button>}</div><div className="acceptance-save-actions"><button className={index<cases.length-1?"secondary":"primary"} type="submit" disabled={!editable||!dirty||!valid||saving}>{mutation.isPending?'Saving…':'Save result'}</button>{index<cases.length-1&&<button type="button" className="primary" disabled={!editable||!dirty||!valid||saving} onClick={()=>mutation.mutate({input:{action:'case',expectedRevision:run.revision,caseId:active,...draft},nextCase:cases[index+1].id})}>Save &amp; next <ArrowRight size={15}/></button>}</div></div>
        </form>
        </div>
      </div>
    </div>
    {(editable||showDecision||!!decisionNotes.trim())&&<section className="acceptance-decision"><div><h2>Complete review</h2><p>{progress.passed===progress.total?'All required cases passed. Record an explicit manual decision.':'Acceptance requires every case to pass. Failed or blocked checks can be returned for corrections.'}</p></div>{!showDecision?<button className="secondary" disabled={dirty||saving} onClick={()=>setShowDecision(true)}>Record review decision</button>:<div className="acceptance-decision-form">{mutation.error&&<p className="warning" role="alert">{mutation.error.message}</p>}<label>Review decision notes<textarea rows={3} maxLength={4000} value={decisionNotes} disabled={!editable||saving} onChange={e=>setDecisionNotes(e.target.value)} placeholder="Summarize the observed results and any limitations."/></label><div className="acceptance-case-actions"><button className="secondary" disabled={saving} onClick={()=>{setDecisionNotes('');setShowDecision(false);mutation.reset();}}>Cancel</button><span className="action-spacer"/><button className="secondary" disabled={!editable||dirty||!decisionNotes.trim()||saving} onClick={()=>{if(window.confirm('Finalize this review as changes requested?'))mutation.mutate({input:{action:'decision',expectedRevision:run.revision,decision:'changes-requested',notes:decisionNotes}});}}>Request changes</button><button className="primary" disabled={!editable||dirty||progress.passed!==progress.total||!decisionNotes.trim()||saving} onClick={()=>{if(window.confirm('Record manual acceptance of this revision? This does not merge the pull request.'))mutation.mutate({input:{action:'decision',expectedRevision:run.revision,decision:'accepted',notes:decisionNotes}});}}>Accept review</button></div></div>}</section>}
  </section>;
}

export default function AcceptanceWorkspace({projectId,record,definition,head,onBusyChange}:{projectId:string;record:ProjectRecord;definition:AcceptanceDefinition;head:string|undefined;onBusyChange:(busy:boolean)=>void}){
  const qc=useQueryClient();
  const listKey=['acceptance-runs',projectId,record.id];
  const list=useQuery({queryKey:listKey,queryFn:()=>api.acceptanceRuns(projectId,record.id),refetchOnWindowFocus:false});
  const [chosen,setChosen]=useState<string|null|undefined>(undefined);
  const [reviewer,setReviewer]=useState(''),[environment,setEnvironment]=useState('');
  const [runBusy,setRunBusy]=useState(false);
  const currentRun=list.data?.runs.find(r=>currentAcceptance(r,head,record.revision)&&r.decision==='open')||list.data?.runs.find(r=>currentAcceptance(r,head,record.revision));
  const runId=chosen===undefined?currentRun?.id||null:chosen;
  // Keep the selected execution mounted even when its HEAD or definition becomes historical.
  useLayoutEffect(()=>{if(chosen===undefined&&runId)setChosen(runId);},[chosen,runId]);
  const runKey=['acceptance-run',projectId,record.id,runId];
  const run=useQuery({queryKey:runKey,queryFn:()=>api.acceptanceRun(projectId,record.id,runId!),enabled:!!runId,staleTime:Infinity,refetchOnWindowFocus:false});
  const start=useMutation({mutationFn:()=>api.startAcceptance(projectId,record.id,{expectedDefinitionRevision:record.revision,expectedHead:head!,reviewer,environment}),onSuccess:next=>{qc.setQueryData(['acceptance-run',projectId,record.id,next.id],next);setChosen(next.id);void qc.invalidateQueries({queryKey:listKey});}});
  const busy=start.isPending||runBusy;
  useLayoutEffect(()=>{onBusyChange(busy);},[busy,onBusyChange]);
  useLayoutEffect(()=>()=>onBusyChange(false),[onBusyChange]);
  const total=definition.groups.reduce((n,g)=>n+g.cases.length,0);
  const runPicker=<div className="acceptance-run-picker"><label>Review run<select aria-label="Review run" value={runId||''} disabled={busy||list.isPending} onChange={e=>setChosen(e.target.value||null)}><option value="">New review</option>{list.data?.runs.map(r=><option key={r.id} value={r.id}>{r.testedRevision.slice(0,8)} · {r.decision==='open'?'In progress':r.decision} · {new Date(r.startedAt).toLocaleString()}</option>)}</select></label>{runId&&<button className="secondary" disabled={busy} onClick={()=>setChosen(null)}><Plus size={15}/> New review</button>}</div>;
  return <section className="acceptance-workspace" aria-label="Acceptance workspace">
    {(!runId||!run.data||run.isError)&&<div className="acceptance-toolbar"><h2>Review execution</h2>{runPicker}</div>}
    {list.error&&<p className="warning" role="alert">{list.error.message}</p>}
    {list.data?.errors.map(e=><p key={e.file} className="warning" role="alert">{e.file}: {e.message}</p>)}
    {list.isPending&&chosen===undefined?<p className="overview-note" role="status">Reading local review history…</p>:runId?(run.error?<p className="warning" role="alert">{run.error.message} <button className="secondary" onClick={()=>{void run.refetch();}}>Retry</button></p>:run.data?<RunPanel key={runId} initial={run.data} projectId={projectId} head={head} record={record} runPicker={runPicker} onBusyChange={setRunBusy} onSaved={next=>{qc.setQueryData(runKey,next);void qc.invalidateQueries({queryKey:listKey});}}/>:<p className="overview-note" role="status">Opening review…</p>):<div className="acceptance-start"><div className="acceptance-start-intro"><div className="eyebrow">NEW REVIEW · {total} CASES</div><h2>Start an acceptance run</h2><p>Record observations against the current Git revision and exact test definition. Existing review runs are preserved.</p><p className="overview-note">Current HEAD: {head?<code title={head}>{head.slice(0,12)}</code>:'unavailable'}. Verify a clean revision before testing; recording HEAD alone does not prove cleanliness.</p><p>Read the setup and safety instructions before beginning. Use disposable data for destructive or editing checks.</p></div><details className="acceptance-instructions"><summary><ChevronRight size={15} aria-hidden="true"/>Review setup and safety instructions</summary><div className="acceptance-detail-body"><Reading body={definition.instructions}/></div></details><form className="acceptance-start-form" onSubmit={e=>{e.preventDefault();if(head&&reviewer.trim()&&environment.trim()&&!start.isPending)start.mutate();}}><label>Reviewer<input required disabled={start.isPending} maxLength={120} value={reviewer} onChange={e=>setReviewer(e.target.value)} placeholder="Reviewer name or identifier"/></label><label>Test environment<input required disabled={start.isPending} maxLength={500} value={environment} onChange={e=>setEnvironment(e.target.value)} placeholder="OS, Node, browser and relevant setup"/></label>{start.error&&<p className="warning" role="alert">{start.error.message}</p>}<button className="primary" disabled={!head||!reviewer.trim()||!environment.trim()||start.isPending||list.isError}>{start.isPending?'Starting…':'Start acceptance'} <ArrowRight size={16}/></button></form><div className="acceptance-plan">{definition.groups.map(g=><div key={g.id}><strong>{g.title}</strong><small>{g.cases.length} cases</small></div>)}</div></div>}
    <p className="overview-note">Runs are saved in the local project acceptance.local directory, outside Git. Export the evidence for review or backup. Test definitions and planning statuses are unchanged by case execution.</p>
  </section>;
}

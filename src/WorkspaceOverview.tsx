import { ArrowUpRight,ArrowRight,AlertTriangle,Flag,Target,ListChecks } from 'lucide-react';
import type { ProjectRecord } from '../shared/records';
import type { ProjectInfo } from '../shared/projects';
import { overviewFor } from '../shared/navigation';
import Status from './Status';
import RouteLink from './RouteLink';
import { reconcileHistory,type GitHistory } from '../shared/delivery';
type Props={project:ProjectInfo;records:ProjectRecord[];findings:number;incomplete:boolean;history:GitHistory|undefined;historyError:boolean;onSelect:(id:string)=>void;onNavigate:(id:string)=>void;hrefFor:(id:string)=>string};
function Row({record,onSelect,hrefFor}:{record:ProjectRecord;onSelect:(id:string)=>void;hrefFor:(id:string)=>string}){
  return <RouteLink className="overview-record" href={hrefFor(record.id)} onNavigate={()=>onSelect(record.id)}><span className={'dot '+record.accent}/><span className="overview-record-title">{record.title}<small>{record.type} · {record.priority} priority</small></span><Status value={record.status}/><ArrowUpRight size={13}/></RouteLink>;
}
function description(body:string){return body.split('\n').find(line=>line.trim()&&!line.startsWith('#')&&!line.startsWith('-'))||'No description yet.';}
export default function WorkspaceOverview({project,records,findings,incomplete,history,historyError,onSelect,onNavigate,hrefFor}:Props){
  const data=overviewFor(records);
  const acceptance=records.filter(r=>r.type==='Test'&&r.status!=='Ready'&&r.tags.some(tag=>tag.toLowerCase()==='acceptance'));
  const reconciliation=history?.state==='available'?reconcileHistory(records,history):undefined;
  return <div className="overview" aria-label="Project overview">
    {incomplete&&<p className="warning" role="status">Some records could not be loaded. This overview may be incomplete.</p>}
    <section className="overview-intro">
      <div className="eyebrow"><Target size={15}/> PROJECT DIRECTION</div>
      {data.objectives.length?<><h2>{data.objectives[0].title}</h2><p>{description(data.objectives[0].body)}</p><RouteLink className="text-action" href={hrefFor(data.objectives[0].id)} onNavigate={()=>onSelect(data.objectives[0].id)}>Read objective <ArrowRight size={14}/></RouteLink>{data.objectives.length>1&&<span className="overview-note">{data.objectives.length-1} additional objective(s) in the Data library.</span>}</>:<><h2>{project.title}</h2><p>No objective has been defined yet.</p></>}
    </section>
    <div className="overview-columns">
      <section className="overview-section"><div className="overview-section-head"><div><span className="eyebrow"><Flag size={14}/> DIRECTION</span><h3>Current milestones</h3></div><button className="text-action" onClick={()=>onNavigate('roadmap')}>Roadmap <ArrowRight size={14}/></button></div>
        {data.activeMilestones.length?data.activeMilestones.map(r=><div key={r.id} className="milestone-preview"><Row record={r} onSelect={onSelect} hrefFor={hrefFor}/><p>{description(r.body)}</p></div>):<p className="overview-note">No milestone is marked In progress.</p>}
      </section>
      <section className="overview-section"><div className="overview-section-head"><div><span className="eyebrow"><AlertTriangle size={14}/> ATTENTION</span><h3>Blockers</h3></div><button className="text-action" onClick={()=>onNavigate('quality')}>Audit <ArrowRight size={14}/></button></div>
        {data.blockers.length?data.blockers.map(r=><Row key={r.id} record={r} onSelect={onSelect} hrefFor={hrefFor}/>):<p className="overview-note">No open tasks tagged blocker.</p>}
        <button className="overview-audit" onClick={()=>onNavigate('quality')}>{findings} record integrity finding{findings===1?'':'s'} <ArrowRight size={14}/></button>
      </section>
    </div>
    {acceptance.length>0&&<section className="overview-section"><div className="overview-section-head"><div><span className="eyebrow"><ListChecks size={14}/> REVIEW</span><h3>Awaiting acceptance</h3></div></div><p className="overview-note">Start or resume acceptance directly. Results are tied to the reviewed revision.</p>{acceptance.map(r=><Row key={r.id} record={r} onSelect={onSelect} hrefFor={hrefFor}/>)}</section>}
    <section className="overview-section"><div className="overview-section-head"><div><span className="eyebrow"><ListChecks size={14}/> EXECUTION</span><h3>Active work</h3></div><button className="text-action" onClick={()=>onNavigate('work')}>All tasks <ArrowRight size={14}/></button></div>
      <p className="overview-note">{data.readyTasks} of {data.totalTasks} tasks marked Ready · {data.plannedTasks.length} planned</p>
      {data.activeTasks.length?data.activeTasks.map(r=><Row key={r.id} record={r} onSelect={onSelect} hrefFor={hrefFor}/>):<p className="overview-note">No active tasks.</p>}
      {data.plannedTasks.length>0&&<><h4>Next planned work</h4>{data.plannedTasks.slice(0,4).map(r=><Row key={r.id} record={r} onSelect={onSelect} hrefFor={hrefFor}/>)}</>}
    </section>
    {project.storage==='repository'&&<section className="overview-section"><div className="overview-section-head"><h3>Delivery evidence</h3><button className="text-action" onClick={()=>onNavigate('changes')}>Changes <ArrowRight size={14}/></button></div>{historyError?<p className="overview-note">Could not refresh Git history.</p>:reconciliation?<><p className="overview-note">{reconciliation.pending.length} non-Ready tasks have linked commits in the loaded history. Review acceptance rather than assuming completion.</p>{reconciliation.pending.slice(0,5).map(r=><Row key={r.id} record={r} onSelect={onSelect} hrefFor={hrefFor}/>)}</>:<p className="overview-note">{history?.state==='available'?'No reconciliation data.':history?.message||'Reading local Git history…'}</p>}</section>}
    <section className="overview-section"><div className="overview-section-head"><h3>Milestone sequence</h3><button className="text-action" onClick={()=>onNavigate('roadmap')}>Open roadmap <ArrowRight size={14}/></button></div>
      {data.milestones.length?<div className="milestone-sequence">{data.milestones.map(r=><RouteLink key={r.id} className={'milestone-step '+(r.status==='In progress'?'current':'')} href={hrefFor(r.id)} onNavigate={()=>onSelect(r.id)}><span className={'milestone-line '+(r.status==='Ready'?'complete':'')}/><strong>{r.title}</strong><Status value={r.status}/></RouteLink>)}</div>:<p className="overview-note">No milestones yet.</p>}
    </section>
  </div>;
}

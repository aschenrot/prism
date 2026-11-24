import { useMemo } from 'react';
import type { ProjectRecord } from '../shared/records';
import { dependencyPlan,type DependencyLink,type DependencyRow } from '../shared/dependencies';
import RouteLink from './RouteLink';
import Status from './Status';
const labels:Record<DependencyRow['state'],string>={cycle:'Dependency cycle',unresolved:'Unresolved prerequisite',waiting:'Waiting on prerequisite',satisfied:'Direct prerequisites marked Ready',none:'No direct prerequisites'};
export default function DependencyPlan({records,visible,incomplete,onOpen,hrefFor}:{records:ProjectRecord[];visible:ProjectRecord[];incomplete:boolean;onOpen:(id:string)=>void;hrefFor:(id:string)=>string}){
 const plan=useMemo(()=>dependencyPlan(records),[records]);
 const rows=visible.map(r=>plan.get(r.id)).filter((r):r is DependencyRow=>!!r);
 const visibleIds=new Set(visible.map(r=>r.id));
 const link=(item:DependencyLink)=><li key={item.id}>{item.record?<><RouteLink href={hrefFor(item.id)} onNavigate={()=>onOpen(item.id)}>{item.record.title}</RouteLink><Status value={item.record.status}/>{!visibleIds.has(item.id)&&<small>Outside current filter</small>}</>:<span className="warning">Unavailable: {item.id}</span>}<small>{item.assertions.join(' + ')}</small></li>;
 return <section className="dependency-plan" aria-label="Dependency planning">
 <p className="overview-note">Explicit depends-on and blocks links define direct prerequisites. Ready is authored status, not verified acceptance. This view does not automatically change status, schedule tasks or infer dependencies from ordinary links.</p>
 {incomplete&&<p role="alert" className="warning">Some records are unavailable. Dependency results may be incomplete.</p>}
 <div className="dependency-summary">{(['waiting','unresolved','cycle','satisfied','none'] as const).map(state=><div key={state}><strong>{rows.filter(r=>r.state===state).length}</strong><span>{labels[state]}</span></div>)}</div>
 {!rows.length&&<p>No matching records.</p>}
 {rows.map(row=><article key={row.record.id} className="dependency-row" aria-label={'Dependencies for '+row.record.title}>
 <div className="dependency-row-title"><RouteLink href={hrefFor(row.record.id)} onNavigate={()=>onOpen(row.record.id)}>{row.record.title}</RouteLink><Status value={row.record.status}/><span className={row.state==='cycle'||row.state==='unresolved'||row.state==='waiting'?'warning':'overview-note'}>{labels[row.state]}</span></div>
 <div className="dependency-sides"><section><h3>Direct prerequisites ({row.prerequisites.length})</h3>{row.prerequisites.length?<ul>{row.prerequisites.map(link)}</ul>:<p>None declared</p>}</section><section><h3>Direct dependents ({row.dependents.length})</h3>{row.dependents.length?<ul>{row.dependents.map(link)}</ul>:<p>None declared</p>}</section></div>
 </article>)}
 </section>;
}

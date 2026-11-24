import { useMemo } from 'react';
import type { ProjectRecord } from '../shared/records';
import { traceabilityFor } from '../shared/traceability';
import RouteLink from './RouteLink';
import Status from './Status';
export default function Traceability({records,visible,incomplete,onOpen,hrefFor}:{records:ProjectRecord[];visible:ProjectRecord[];incomplete:boolean;onOpen:(id:string)=>void;hrefFor:(id:string)=>string}){
 const trace=useMemo(()=>traceabilityFor(records,visible),[records,visible]);
 const link=(r:ProjectRecord)=><RouteLink href={hrefFor(r.id)} onNavigate={()=>onOpen(r.id)}>{r.title}</RouteLink>;
 const cell=(records:ProjectRecord[])=><>{records.length?<ul>{records.map(r=><li key={r.id}>{link(r)}<small>{r.type} · <Status value={r.status}/></small></li>)}</ul>:<span className="trace-gap">No explicit link</span>}</>;
 return <section className="traceability-view" aria-label="Requirements traceability">
 <p className="overview-note">Requirements and features in the current collection are rows. Incoming explicit Implements, Verifies and Documents links are resolved across the loaded project, including records outside the filter. Generic links and authored Ready status do not establish implementation or test results.</p>
 {incomplete&&<p className="warning" role="alert">Some records could not be loaded. Link counts may be incomplete.</p>}
 <div className="dependency-summary"><div><strong>{trace.rows.length}</strong><span>Requirements and features</span></div><div><strong>{trace.missingImplementation}</strong><span>Without implementation links</span></div><div><strong>{trace.missingTests}</strong><span>Without test links</span></div><div><strong>{trace.invalid}</strong><span>Invalid incoming links</span></div></div>
 {trace.rows.length?<div className="table-wrap traceability-scroll"><table className="traceability-table"><thead><tr><th scope="col">Requirement / feature</th><th scope="col">Implementation links</th><th scope="col">Test links (not results)</th><th scope="col">Documentation</th><th scope="col">Link issues</th></tr></thead><tbody>{trace.rows.map(row=><tr key={row.record.id}><th scope="row">{link(row.record)}<small><Status value={row.record.status}/></small></th><td>{cell(row.implementation)}</td><td>{cell(row.tests)}</td><td>{cell(row.documents)}</td><td>{row.invalid.length?<ul>{row.invalid.map(item=><li key={item.source.id+':'+item.kind}>{link(item.source)}<small className="warning">{item.issue}</small></li>)}</ul>:<small>None detected</small>}</td></tr>)}</tbody></table></div>:<p>No matching requirements or features. Change the collection or filters.</p>}
 </section>;
}

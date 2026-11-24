import { dateFields,dayLabel,timelineProjection,timelinePosition,type TimelineConfig } from '../shared/timeline';
import type { ProjectPropertySchema } from '../shared/customProperties';
import type { ProjectRecord } from '../shared/records';
import RouteLink from './RouteLink';
import Status from './Status';
export default function Timeline({records,schema,config,disabled,incomplete,onChange,onOpen,hrefFor}:{records:ProjectRecord[];schema?:ProjectPropertySchema;config?:TimelineConfig;disabled:boolean;incomplete:boolean;onChange:(config:TimelineConfig|undefined)=>void;onOpen:(id:string)=>void;hrefFor:(id:string)=>string}){
 const fields=dateFields(schema),projection=timelineProjection(records,schema,config),range=projection.range;
 const link=(r:ProjectRecord)=><RouteLink href={hrefFor(r.id)} onNavigate={()=>onOpen(r.id)}>{r.title}</RouteLink>;
 const options=(selected:string|undefined,exclude?:string)=><>{selected&&!fields.some(f=>f.id===selected)&&<option value={selected}>Unavailable: {selected}</option>}{fields.filter(f=>f.id!==exclude).map(f=><option key={f.id} value={f.id}>{f.label}</option>)}</>;
 return <section className="timeline-view" aria-label="Authored timeline">
 <div className="timeline-config"><label>Date or start field<select aria-label="Date or start field" disabled={disabled} value={config?.start??''} onChange={e=>onChange(e.target.value?{start:e.target.value,...(config?.end&&config.end!==e.target.value?{end:config.end}:{})}:undefined)}><option value="">Choose a date field</option>{options(config?.start)}</select></label>
 <label>End field (optional)<select aria-label="End field (optional)" disabled={disabled||!config?.start} value={config?.end??''} onChange={e=>{if(config)onChange({start:config.start,...(e.target.value?{end:e.target.value}:{})});}}><option value="">Single date markers</option>{options(config?.end,config?.start)}</select></label></div>
 <p className="overview-note">Only configured calendar-date properties are used. Date markers and inclusive ranges are read-only projections; edit dates in the record editor. Missing, invalid and reversed dates are not estimated. Save the view to reuse its field mapping.</p>
 {incomplete&&<p role="alert" className="warning">Some records could not be read; timeline may be incomplete.</p>}
 {!schema&&<p className="warning">Project schema unavailable. No date values are interpreted.</p>}
 {projection.issue?<p role="status">{projection.issue}</p>:<>
 <p className="overview-note">{projection.scheduled.length} dated · {projection.unscheduled.length} not plotted</p>
 {range&&<div className="timeline-scroll"><table className="timeline-table"><thead><tr><th>Record</th><th>Authored dates</th><th><div className="timeline-axis"><span>{dayLabel(range.min)}</span>{range.max!==range.min&&<span>{dayLabel(range.max)}</span>}</div></th></tr></thead><tbody>{projection.scheduled.map(item=>{const pos=timelinePosition(range,item);return <tr key={item.record.id}><td>{link(item.record)}<Status value={item.record.status}/></td><td>{item.start}{item.end&&<> – {item.end}</>}</td><td><div className="timeline-track" aria-hidden="true">{item.end?<span className="timeline-bar" style={{left:pos.left+'%',width:pos.width+'%'}}/>:<span className="timeline-marker" style={{left:pos.left+pos.width/2+'%'}}/>}</div></td></tr>;})}</tbody></table></div>}
 {!range&&<p>No records have valid dates for this mapping.</p>}
 {!!projection.unscheduled.length&&<section className="timeline-unplotted" aria-label="Unplotted records"><h2>Not plotted</h2>{projection.unscheduled.map(item=><div key={item.record.id}>{link(item.record)}<span>{item.reason}</span></div>)}</section>}
 </>}
 </section>;
}

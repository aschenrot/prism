import { useQuery } from '@tanstack/react-query';
import type { ProjectRecord,Editable } from '../shared/records';
import { appliesTo,changedCustomKeys,customPropertyIssue,type CustomValues,type CustomValue,type PropertyDefinition } from '../shared/customProperties';
import { api } from './api';
export function useProjectSchema(projectId:string){
 return useQuery({queryKey:['project-schema',projectId],queryFn:()=>api.schema(projectId),refetchInterval:5000,retry:false});
}
function display(value:CustomValue|undefined){return value===undefined?'Not set':value===true?'Yes':value===false?'No':String(value);}
function optionsFor(field:PropertyDefinition,records:ProjectRecord[],sourceId:string){
 if(field.kind==='enum')return field.options;
 if(field.kind==='reference')return records.filter(r=>r.id!==sourceId&&(!field.targetTypes||field.targetTypes.includes(r.type))).sort((a,b)=>a.title.localeCompare(b.title)||a.id.localeCompare(b.id)).map(r=>({id:r.id,label:r.title+' · '+r.id}));
 return [];
}
function PropertyInput({field,value,records,sourceId,onChange,disabled}:{field:PropertyDefinition;value:CustomValue|undefined;records:ProjectRecord[];sourceId:string;onChange:(value:CustomValue|undefined)=>void;disabled:boolean}){
 const options=optionsFor(field,records,sourceId);
 if(field.kind==='boolean')return <label>{field.label}<select disabled={disabled} value={value===true?'yes':value===false?'no':value===undefined?'':'invalid'} onChange={e=>onChange(e.target.value===''?undefined:e.target.value==='yes')}><option value="">Not set</option>{value!==undefined&&typeof value!=='boolean'&&<option value="invalid" disabled>Invalid stored value: {display(value)}</option>}<option value="yes">Yes</option><option value="no">No</option></select></label>;
 if(field.kind==='enum'||field.kind==='reference'){
  const selected=value===undefined?'':typeof value==='string'&&options.some(o=>o.id===value)?value:'__invalid__';
  return <label>{field.label}<select disabled={disabled} value={selected} onChange={e=>onChange(e.target.value||undefined)}><option value="">Not set</option>{selected==='__invalid__'&&<option value="__invalid__" disabled>Unavailable value: {display(value)}</option>}{options.map(o=><option key={o.id} value={o.id}>{o.label}</option>)}</select></label>;
 }
 // Keep incomplete numeric/date text in the recoverable draft; validate on save.
 return <label>{field.label}<input disabled={disabled} inputMode={field.kind==='number'?'decimal':undefined} placeholder={field.kind==='date'?'YYYY-MM-DD':undefined} maxLength={2000} value={value===undefined?'':String(value)} onChange={e=>{
  const raw=e.target.value;
  if(field.kind==='number'&&raw.trim()!==''&&/^[+-]?(?:\d+(?:\.\d+)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(raw)&&Number.isFinite(Number(raw)))onChange(Number(raw));
  else onChange(raw===''&&field.kind!=='text'?undefined:raw);
 }}/></label>;
}
type Query=ReturnType<typeof useProjectSchema>;
export function CustomPropertyFields({query,type,sourceId,values,base,records,schemaStale,onChange,onReview,onRestore}:{query:Query;type:Editable['type'];sourceId:string;values:CustomValues|undefined;base:CustomValues|undefined;records:ProjectRecord[];schemaStale:boolean;onChange:(id:string,value:CustomValue|undefined)=>void;onReview:()=>void;onRestore:(id:string)=>void}){
 const data=!query.isError&&query.data?.state==='available'?query.data:undefined;
 const fields=data?.definition.fields.filter(f=>appliesTo(f,type))??[];
 const changed=changedCustomKeys(base,values);
 const inactive=[...new Set([...Object.keys(values??{}),...changed])].filter(id=>!fields.some(f=>f.id===id));
 if(!query.isError&&query.data?.state==='available'&&!fields.length&&!inactive.length&&!schemaStale)return null;
 return <section className="custom-property-fields" aria-label="Custom properties"><h3>Custom properties</h3>
 {query.isError||query.data?.state==='error'?<p className="warning" role="alert">{query.data?.state==='error'?query.data.message:'Could not read project schema.'} Existing values are preserved.</p>:query.isPending?<p role="status">Reading project schema…</p>:null}
 {schemaStale&&<div className="warning" role="alert">Project schema changed or is unavailable. Your property draft is retained. {data&&<button type="button" className="secondary" onClick={onReview}>Review current schema</button>}</div>}
 {fields.map(field=>{
  const value=values?.[field.id],issue=value===undefined?undefined:customPropertyIssue(field,type,value,sourceId,records.find(r=>r.id===value));
  return <div key={field.id}><div className="property-input-row"><PropertyInput field={field} value={value} records={records} sourceId={sourceId} disabled={schemaStale} onChange={next=>onChange(field.id,next)}/>{value!==undefined&&<button type="button" className="secondary" aria-label={'Clear '+field.label} disabled={schemaStale} onClick={()=>onChange(field.id,undefined)}>Clear</button>}</div>{issue&&<p className="property-value-note warning">{issue}</p>}</div>;
 })}
 {inactive.map(id=><div key={id}><p className="property-value-note">{id}: {display(values?.[id])} · Not configured for this type or schema unavailable. Preserved without conversion.</p>{changed.includes(id)&&<button type="button" className="secondary" onClick={()=>onRestore(id)}>Restore saved {id}</button>}</div>)}
 </section>;
}
export function CustomPropertyReadout({projectId,record,records}:{projectId:string;record:ProjectRecord;records:ProjectRecord[]}){
 const query=useProjectSchema(projectId);
 const data=!query.isError&&query.data?.state==='available'?query.data:undefined;
 const fields=data?.definition.fields.filter(f=>appliesTo(f,record.type))??[],values=record.customProperties??{};
 const inactive=Object.keys(values).filter(id=>!fields.some(f=>f.id===id));
 if(!fields.length&&!inactive.length&&!query.isError&&query.data?.state!=='error')return null;
 return <section className="record-reading custom-property-readout" aria-label="Custom properties"><h2>Custom properties</h2>
 {query.isError||query.data?.state==='error'?<p className="warning" role="alert">{query.data?.state==='error'?query.data.message:'Could not read project schema.'}</p>:null}
 <dl>{fields.map(field=>{const value=values[field.id],issue=value===undefined?undefined:customPropertyIssue(field,record.type,value,record.id,records.find(r=>r.id===value));const label=field.kind==='enum'?field.options.find(o=>o.id===value)?.label:field.kind==='reference'?records.find(r=>r.id===value)?.title:undefined;return <div key={field.id}><dt>{field.label}</dt><dd>{label??display(value)}{issue&&<p className="property-value-note warning">{issue}</p>}</dd></div>;})}
 {inactive.map(id=><div key={id}><dt>{id}</dt><dd>{display(values[id])} <small>· Preserved inactive value</small></dd></div>)}</dl>
 </section>;
}

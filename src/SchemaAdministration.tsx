import { useLayoutEffect,useState,useEffect,type FormEvent } from 'react';
import { useMutation,useQueryClient } from '@tanstack/react-query';
import { Plus,Archive,Settings2 } from 'lucide-react';
import { types,type ProjectRecord, type Editable } from '../shared/records';
import { projectPropertySchema,schemaTransitionIssue,type PropertyDefinition,type ProjectPropertySchema } from '../shared/customProperties';
import { useProjectSchema } from './CustomProperties';
import { api } from './api';
import EntityAdministration from './EntityAdministration';
import { propertyFormSchema } from '../shared/definitionDrafts';
import { useDefinitionRecovery,DefinitionRecoveryControls } from './useDefinitionRecovery';
const kinds=['text','number','date','boolean','enum','reference'] as const;
const labelFor={text:'Text',number:'Number',date:'Date',boolean:'Yes / No',enum:'Choice',reference:'Record reference'};
function changeKind(field:PropertyDefinition,kind:PropertyDefinition['kind']):PropertyDefinition{
 const common={id:field.id,label:field.label,appliesTo:field.appliesTo,appliesToEntities:field.appliesToEntities};
 return kind==='enum'?{...common,kind,options:[{id:'',label:''}]}:kind==='reference'?{...common,kind}:{...common,kind};
}
function ScopePicker({label,value,onChange}:{label:string;value:Editable['type'][]|undefined;onChange:(value:Editable['type'][]|undefined)=>void}){
 return <fieldset className="schema-scope"><legend>{label}</legend><label className="schema-check"><input type="checkbox" checked={value===undefined} onChange={e=>onChange(e.target.checked?undefined:[])}/> All built-in record types</label>{value!==undefined&&<div className="schema-type-grid">{types.map(type=><label className="schema-check" key={type}><input type="checkbox" checked={value.includes(type)} onChange={e=>onChange(e.target.checked?[...value,type]:value.filter(t=>t!==type))}/>{type}</label>)}</div>}</fieldset>;
}
export default function SchemaAdministration({projectId,records,incomplete,onBusyChange}:{projectId:string;records:ProjectRecord[];incomplete:boolean;onBusyChange:(busy:boolean)=>void}){
 const query=useProjectSchema(projectId),qc=useQueryClient();
 const schema=!query.isError&&query.data?.state==='available'?query.data:undefined;
 const recovery=useDefinitionRecovery(projectId,'property',propertyFormSchema),{session,setSession}=recovery;
 const [message,setMessage]=useState(''),[error,setError]=useState(''),[entityBusy,setEntityBusy]=useState(false);
 const mutation=useMutation({mutationFn:({revision,definition}:{revision:string;definition:ProjectPropertySchema})=>api.updateSchema(projectId,revision,definition),onSuccess:async saved=>{
  if(saved.state!=='available'){setError(saved.message);return;}
  await qc.cancelQueries({queryKey:['project-schema',projectId]});
  qc.setQueryData(['project-schema',projectId],saved);setSession(null);setError('');setMessage('Schema saved. Record values were not rewritten.');void qc.invalidateQueries({queryKey:['project-schema',projectId]});
 },onError:err=>{setError(err.message);void query.refetch();}});
 const busy=!!session||mutation.isPending||entityBusy;
 useLayoutEffect(()=>{onBusyChange(busy);},[busy,onBusyChange]);
 useLayoutEffect(()=>()=>onBusyChange(false),[onBusyChange]);
 useEffect(()=>{if(!busy)return;const warn=(event:BeforeUnloadEvent)=>{event.preventDefault();event.returnValue='';};window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn);},[busy]);
 const start=(field?:PropertyDefinition)=>{
  if(!schema)return;
  setError('');setMessage('');mutation.reset();
  setSession({revision:schema.revision,base:schema.definition,original:field,draft:field??{id:'',label:'',kind:'text'}});
 };
 const change=(draft:PropertyDefinition)=>{setSession(s=>s?{...s,draft}:s);setError('');};
 const stale=!!session&&(!schema||session.revision!==schema.revision||JSON.stringify(session.base)!==JSON.stringify(schema.definition));
 const safeReapply=!!session&&!!schema&&(session.original?JSON.stringify(schema.definition.fields.find(f=>f.id===session.original?.id))===JSON.stringify(session.original):!schema.definition.fields.some(f=>f.id===session.draft.id));
 const cancel=()=>{
  if(mutation.isPending)return;
  if(session&&(session.original?JSON.stringify(session.draft)!==JSON.stringify(session.original):JSON.stringify(session.draft)!==JSON.stringify({id:'',label:'',kind:'text'}))&&!window.confirm('Discard unsaved schema changes? Record values will not change.'))return;
  setSession(null);setError('');mutation.reset();
 };
 const save=(event:FormEvent)=>{
  event.preventDefault();if(!session||stale||mutation.isPending)return;
  const fields=session.original?session.base.fields.map(f=>f.id===session.original?.id?session.draft:f):[...session.base.fields,session.draft];
  const parsed=projectPropertySchema.safeParse({...session.base,fields});
  if(!parsed.success){setError(parsed.error.issues.map(i=>i.message).join('; '));return;}
  const issue=schemaTransitionIssue(session.base,parsed.data);if(issue){setError(issue);return;}
  mutation.mutate({revision:session.revision,definition:parsed.data});
 };
 const draft=session?.draft;
 return <section className="schema-admin overview-section" aria-label="Project schema administration">
 <div className="overview-section-head"><div><div className="eyebrow"><Settings2 size={14}/> PROJECT DATA</div><h3>Property definitions</h3></div><button className="primary" disabled={!schema||busy||!recovery.canStart||schema.definition.fields.length>=50} onClick={()=>start()}><Plus size={15}/> New property</button></div>
 <p className="overview-note">Definitions belong to this project. Stable IDs and value kinds cannot be changed after creation. Retiring hides a field from editing, preserving its values. No record files are rewritten.</p>
 {query.isError||query.data?.state==='error'?<p role="alert" className="warning">{query.data?.state==='error'?query.data.message:'Could not read project schema.'} Repair the schema file before editing.</p>:query.isPending?<p role="status">Reading project schema…</p>:schema?<p className="overview-note">{schema.configured?'Version 1 schema · '+schema.definition.fields.length+' / 50 properties':'No schema yet. Add a property to create one.'} · Revision <code>{schema.revision.slice(0,12)}</code></p>:null}
 {message&&<p role="status" className="check-passed">{message}</p>}
 <DefinitionRecoveryControls recovery={recovery} disabled={mutation.isPending||entityBusy} label="property"/>
 {session&&draft&&<form className="schema-form editor" onSubmit={save} aria-label={session.original?'Edit property definition':'Create property definition'}>
 <h3>{session.original?'Edit '+session.original.label:'New property'}</h3>
 {stale&&<div role="alert" className="warning">Schema changed or is unavailable. Your unsaved definition is retained. {safeReapply?<button type="button" className="secondary" onClick={()=>{if(schema)setSession(s=>s?{...s,revision:schema.revision,base:schema.definition}:s);setError('');}}>Review current schema and keep draft</button>:<p>The same property changed or the ID is now used. Review the current list; cancel and restart when ready.</p>}</div>}
 <fieldset disabled={mutation.isPending}>
 <label>Property ID<input value={draft.id} maxLength={48} disabled={!!session.original} onChange={e=>change({...draft,id:e.target.value})} placeholder="estimated-hours"/></label>
 <label>Property label<input value={draft.label} maxLength={100} onChange={e=>change({...draft,label:e.target.value})}/></label>
 <label>Value kind<select aria-label="Value kind" disabled={!!session.original} value={draft.kind} onChange={e=>change(changeKind(draft,e.target.value as PropertyDefinition['kind']))}>{kinds.map(kind=><option key={kind} value={kind}>{labelFor[kind]}</option>)}</select></label>
 {session.original?<p className="overview-note">Record types: {draft.appliesTo?.join(', ')??'All built-in types'}</p>:<ScopePicker label="Applies to" value={draft.appliesTo} onChange={appliesTo=>change({...draft,appliesTo})}/>}
 {schema?.definition.entityTypes?.length?session.original?<p className="overview-note">Custom entity scope: {draft.appliesToEntities?.join(', ')??'All compatible entities'}</p>:<fieldset className="schema-scope"><legend>Custom entity scope</legend><label className="schema-check"><input type="checkbox" checked={draft.appliesToEntities===undefined} onChange={e=>change({...draft,appliesToEntities:e.target.checked?undefined:[]})}/> All compatible entities</label>{draft.appliesToEntities!==undefined&&<div className="schema-type-grid">{schema.definition.entityTypes.filter(e=>!e.retired&&(!draft.appliesTo||draft.appliesTo.includes(e.baseType))).map(entity=><label className="schema-check" key={entity.id}><input type="checkbox" checked={draft.appliesToEntities?.includes(entity.id)} onChange={e=>change({...draft,appliesToEntities:e.target.checked?[...(draft.appliesToEntities??[]),entity.id]:(draft.appliesToEntities??[]).filter(id=>id!==entity.id)})}/>{entity.label}</label>)}</div>}</fieldset>:null}
 {draft.kind==='reference'&&(session.original?<p className="overview-note">Reference targets: {draft.targetTypes?.join(', ')??'All built-in types'}</p>:<ScopePicker label="Reference targets" value={draft.targetTypes} onChange={targetTypes=>change({...draft,targetTypes})}/>)}
 {draft.kind==='enum'&&<div className="schema-options"><strong>Choices</strong>{draft.options.map((option,index)=>{
  const existing=session.original?.kind==='enum'&&session.original.options.some(o=>o.id===option.id);
  return <div className="schema-option-row" key={index}><label>Option {index+1} ID<input disabled={existing} value={option.id} maxLength={48} onChange={e=>change({...draft,options:draft.options.map((o,i)=>i===index?{...o,id:e.target.value}:o)})}/></label><label>Option {index+1} label<input value={option.label} maxLength={100} onChange={e=>change({...draft,options:draft.options.map((o,i)=>i===index?{...o,label:e.target.value}:o)})}/></label>{!existing&&draft.options.length>1&&<button type="button" className="secondary" onClick={()=>change({...draft,options:draft.options.filter((_,i)=>i!==index)})}>Remove new option</button>}</div>;
 })}<button type="button" className="secondary" disabled={draft.options.length>=40} onClick={()=>change({...draft,options:[...draft.options,{id:'',label:''}]})}>Add choice</button></div>}
 {session.original&&<label className="schema-check"><input type="checkbox" checked={!!draft.retired} onChange={e=>change({...draft,retired:e.target.checked})}/> Retire property (preserve all values)</label>}
 </fieldset>
 {error&&<p role="alert" className="warning">{error}</p>}
 <div className="schema-actions"><button className="secondary" type="button" disabled={mutation.isPending} onClick={cancel}>Cancel</button><button className="primary" type="submit" disabled={stale||mutation.isPending}>{mutation.isPending?'Saving…':'Save property'}</button></div>
 <p className="overview-note">Unsubmitted schema edits can be kept locally, resumed or exported. Saving still requires the current schema revision.</p>
 </form>}
 {schema&&<div className="schema-definition-list">{schema.definition.fields.map(field=>{
  const count=records.filter(r=>Object.hasOwn(r.customProperties??{},field.id)).length;
  return <article className="schema-definition-row" key={field.id}><div><strong>{field.label} {field.retired&&<span className="schema-retired"><Archive size={12}/> Retired</span>}</strong><small><code>{field.id}</code> · {labelFor[field.kind]} · {field.appliesTo?.join(', ')??'All built-in types'}{field.appliesToEntities?' · Entities: '+field.appliesToEntities.join(', '):''}</small><small>{count} loaded active records with a stored value{field.kind==='enum'?' · '+field.options.length+' choices':''}</small></div><button className="secondary" disabled={busy||!recovery.canStart} aria-label={'Edit '+field.label} onClick={()=>start(field)}>Edit</button></article>;
 })}</div>}
 <p className="overview-note">Usage is a count of loaded active records, not a complete inventory of trash or history.{incomplete?' Some active records could not be read.':''} Retire rather than delete, even if the displayed usage is zero.</p>
 <EntityAdministration projectId={projectId} records={records} disabled={!!session||mutation.isPending} onBusyChange={setEntityBusy}/>
 </section>;
}

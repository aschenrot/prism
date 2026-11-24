import { useLayoutEffect,useState,type FormEvent } from 'react';
import { useMutation,useQueryClient } from '@tanstack/react-query';
import { types,type ProjectRecord } from '../shared/records';
import { projectPropertySchema,type EntityDefinition,type ProjectPropertySchema } from '../shared/customProperties';
import { useProjectSchema } from './CustomProperties';
import { api } from './api';
type Session={revision:string;base:ProjectPropertySchema;original?:EntityDefinition;draft:EntityDefinition};
export default function EntityAdministration({projectId,records,disabled,onBusyChange}:{projectId:string;records:ProjectRecord[];disabled:boolean;onBusyChange:(busy:boolean)=>void}){
 const query=useProjectSchema(projectId),qc=useQueryClient();
 const schema=!query.isError&&query.data?.state==='available'?query.data:undefined;
 const [session,setSession]=useState<Session|null>(null),[error,setError]=useState(''),[message,setMessage]=useState('');
 const mutation=useMutation({mutationFn:({revision,definition}:{revision:string;definition:ProjectPropertySchema})=>api.updateSchema(projectId,revision,definition),onSuccess:async result=>{
  if(result.state!=='available'){setError(result.message);return;}
  await qc.cancelQueries({queryKey:['project-schema',projectId]});qc.setQueryData(['project-schema',projectId],result);
  setSession(null);setError('');setMessage('Entity definition saved. Record identities and values were not rewritten.');void qc.invalidateQueries({queryKey:['project-schema',projectId]});
 },onError:err=>{setError(err.message);void query.refetch();}});
 const busy=!!session||mutation.isPending;
 useLayoutEffect(()=>{onBusyChange(busy);},[busy,onBusyChange]);
 useLayoutEffect(()=>()=>onBusyChange(false),[onBusyChange]);
 const start=(entity?:EntityDefinition)=>{if(!schema||disabled)return;setSession({revision:schema.revision,base:schema.definition,original:entity,draft:entity??{id:'',label:'',baseType:'Task'}});setError('');setMessage('');};
 const change=(draft:EntityDefinition)=>setSession(s=>s?{...s,draft}:s);
 const stale=!!session&&(!schema||schema.revision!==session.revision);
 const save=(event:FormEvent)=>{
  event.preventDefault();if(!session||stale||mutation.isPending)return;
  const prior=session.base.entityTypes??[];
  const entityTypes=session.original?prior.map(e=>e.id===session.original?.id?session.draft:e):[...prior,session.draft];
  const parsed=projectPropertySchema.safeParse({...session.base,entityTypes});
  if(!parsed.success){setError(parsed.error.issues.map(i=>i.message).join('; '));return;}
  mutation.mutate({revision:session.revision,definition:parsed.data});
 };
 const cancel=()=>{if(mutation.isPending)return;if(session&&JSON.stringify(session.draft)!==JSON.stringify(session.original??{id:'',label:'',baseType:'Task'})&&!window.confirm('Discard the unsaved entity definition?'))return;setSession(null);setError('');};
 const draft=session?.draft;
 return <section className="schema-entity-admin" aria-label="Custom entity definitions">
 <div className="overview-section-head"><div><h3>Custom entity types</h3><p className="overview-note">Custom names and property scopes extend stable built-in roles. Retire types without changing existing records.</p></div><button type="button" className="primary" disabled={disabled||busy||!schema||(schema.definition.entityTypes?.length??0)>=40} onClick={()=>start()}>New entity type</button></div>
 {message&&<p role="status" className="check-passed">{message}</p>}
 {session&&draft&&<form className="schema-form editor" aria-label={session.original?'Edit entity definition':'Create entity definition'} onSubmit={save}>
 <h3>{session.original?'Edit '+session.original.label:'New entity type'}</h3>
 {stale&&<p role="alert" className="warning">Schema changed or is unavailable. Your input is retained; review the current definition, then cancel and restart.</p>}
 <fieldset disabled={mutation.isPending}><label>Entity ID<input disabled={!!session.original} value={draft.id} maxLength={48} onChange={e=>change({...draft,id:e.target.value})}/></label>
 <label>Entity label<input value={draft.label} maxLength={100} onChange={e=>change({...draft,label:e.target.value})}/></label>
 <label>Built-in role<select aria-label="Built-in role" disabled={!!session.original} value={draft.baseType} onChange={e=>change({...draft,baseType:e.target.value as EntityDefinition['baseType']})}>{types.map(type=><option key={type}>{type}</option>)}</select></label>
 {session.original&&<label className="schema-check"><input type="checkbox" checked={!!draft.retired} onChange={e=>change({...draft,retired:e.target.checked})}/> Retire entity type</label>}
 </fieldset>{error&&<p role="alert" className="warning">{error}</p>}
 <div className="schema-actions"><button type="button" className="secondary" disabled={mutation.isPending} onClick={cancel}>Cancel</button><button type="submit" className="primary" disabled={stale||mutation.isPending}>Save entity type</button></div></form>}
 <div className="schema-definition-list">{schema?.definition.entityTypes?.map(entity=><article className="schema-definition-row" key={entity.id}><div><strong>{entity.label}{entity.retired?' · Retired':''}</strong><small>{entity.id} · Built-in role {entity.baseType} · {records.filter(r=>r.customTypeId===entity.id).length} loaded active records</small></div><button className="secondary" aria-label={'Edit entity '+entity.label} disabled={disabled||busy} onClick={()=>start(entity)}>Edit</button></article>)}</div>
 </section>;
}

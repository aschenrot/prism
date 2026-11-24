import { useEffect,useLayoutEffect,useState,type FormEvent } from 'react';
import { useMutation,useQuery,useQueryClient } from '@tanstack/react-query';
import { types,priorities,accents,type ProjectRecord } from '../shared/records';
import { templateInputSchema,templateValues,type RecordTemplate,type TemplateInput } from '../shared/templates';
import { useProjectSchema,CustomPropertyFields,EntityTypeField } from './CustomProperties';
import { api } from './api';
const blank:TemplateInput={name:'',title:'',type:'Task',priority:'Normal',accent:'violet',tags:[],body:''};
export default function TemplateAdministration({projectId,records,onBusyChange}:{projectId:string;records:ProjectRecord[];onBusyChange:(busy:boolean)=>void}){
 const qc=useQueryClient(),query=useQuery({queryKey:['templates',projectId],queryFn:()=>api.templates(projectId),refetchInterval:5000}),schema=useProjectSchema(projectId);
 const [draft,setDraft]=useState<TemplateInput|null>(null),[original,setOriginal]=useState<RecordTemplate|null>(null),[message,setMessage]=useState(''),[error,setError]=useState('');
 const mutation=useMutation({mutationFn:(input:TemplateInput)=>original?api.updateTemplate(projectId,original.id,original.revision,input):api.createTemplate(projectId,input),onSuccess:async()=>{await qc.invalidateQueries({queryKey:['templates',projectId]});setDraft(null);setOriginal(null);setMessage('Template saved. Existing records were not changed.');},onError:e=>{setError(e.message);void query.refetch();}});
 const busy=!!draft||mutation.isPending;useLayoutEffect(()=>{onBusyChange(busy);},[busy,onBusyChange]);useLayoutEffect(()=>()=>onBusyChange(false),[onBusyChange]);
 useEffect(()=>{if(!busy)return;const warn=(e:BeforeUnloadEvent)=>{e.preventDefault();e.returnValue='';};window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn);},[busy]);
 const stale=!!original&&(query.isError||!query.data?.templates.some(t=>t.id===original.id&&t.revision===original.revision));
 const start=(template?:RecordTemplate)=>{setOriginal(template??null);setDraft(template?templateValues(template):{...blank});setError('');setMessage('');mutation.reset();};
 const save=(e:FormEvent)=>{e.preventDefault();if(!draft||stale||mutation.isPending)return;const parsed=templateInputSchema.safeParse(draft);if(!parsed.success){setError(parsed.error.issues.map(i=>i.message).join('; '));return;}setError('');mutation.mutate(parsed.data);};
 const change=(patch:Partial<TemplateInput>)=>setDraft(d=>d?{...d,...patch}:d);
 return <section className="schema-admin overview-section" aria-label="Project templates">
 <div className="overview-section-head"><div><div className="eyebrow">PROJECT DATA</div><h3>Record templates</h3></div><button className="primary" disabled={busy||query.isError||query.isPending} onClick={()=>start()}>New template</button></div>
 <p className="overview-note">Templates copy initial content, never relationships, delivery evidence or acceptance. New records always start in Concept. Defaults are checked against the current schema when applied. Retire to stop new use; existing records stay independent.</p>
 {query.isPending&&<p role="status">Loading templates…</p>}{query.error&&<p role="alert" className="warning">{query.error.message}</p>}{query.data?.errors.map(e=><p role="alert" className="warning" key={e.file}>{e.file}: {e.message}</p>)}
 {message&&<p role="status">{message}</p>}
 {draft&&<form className="schema-form" onSubmit={save} aria-label="Template definition">
 {stale&&<p className="warning" role="alert">Template changed or is unavailable. Your input is retained; cancel and reopen the current definition before saving.</p>}
 <label>Template name<input value={draft.name} maxLength={100} onChange={e=>change({name:e.target.value})}/></label>
 <label>Default title<input value={draft.title} maxLength={160} onChange={e=>change({title:e.target.value})}/></label>
 <label>Built-in role<select aria-label="Built-in role" value={draft.type} onChange={e=>change({type:e.target.value as TemplateInput['type'],customTypeId:null})}>{types.map(t=><option key={t}>{t}</option>)}</select></label>
 <EntityTypeField query={schema} role={draft.type} value={draft.customTypeId} disabled={mutation.isPending} onChange={customTypeId=>change({customTypeId})}/>
 <label>Default priority<select aria-label="Default priority" value={draft.priority} onChange={e=>change({priority:e.target.value as TemplateInput['priority']})}>{priorities.map(p=><option key={p}>{p}</option>)}</select></label>
 <label>Accent<select aria-label="Accent" value={draft.accent} onChange={e=>change({accent:e.target.value as TemplateInput['accent']})}>{accents.map(a=><option key={a}>{a}</option>)}</select></label>
 <label>Tags (comma separated)<input value={draft.tags.join(',')} onChange={e=>change({tags:e.target.value.split(',')})}/></label>
 <label>Default body<textarea rows={8} maxLength={50000} value={draft.body} onChange={e=>change({body:e.target.value})}/></label>
 <CustomPropertyFields query={schema} type={draft.type} entityId={draft.customTypeId} sourceId="" values={draft.customProperties} base={undefined} records={records} schemaStale={mutation.isPending} onChange={(id,value)=>{const next={...draft.customProperties};if(value===undefined)delete next[id];else next[id]=value;change({customProperties:next});}} onReview={()=>{}} onRestore={id=>{const next={...draft.customProperties};delete next[id];change({customProperties:next});}}/>
 {original&&<label className="schema-check"><input type="checkbox" checked={!!draft.retired} onChange={e=>change({retired:e.target.checked})}/> Retire template</label>}
 {error&&<p className="warning" role="alert">{error}</p>}
 <div className="schema-form-actions"><button className="primary" disabled={stale||mutation.isPending}>Save template</button><button type="button" className="secondary" disabled={mutation.isPending} onClick={()=>{if(window.confirm('Discard unsaved template changes?')){setDraft(null);setOriginal(null);setError('');}}}>Cancel</button></div>
 </form>}
 {!draft&&<div className="schema-list">{query.data?.templates.map(t=><article className="schema-list-row" key={t.id}><div><strong>{t.name}</strong><p>{t.type} · {t.title}{t.retired?' · Retired':''}</p></div><button className="secondary" aria-label={'Edit template '+t.name} onClick={()=>start(t)}>Edit</button></article>)}</div>}
 {!draft&&!query.isPending&&!query.data?.templates.length&&<p>No templates yet.</p>}
 </section>;
}

import {useEffect,useLayoutEffect,useState,type FormEvent} from 'react';
import {useMutation,useQueryClient} from '@tanstack/react-query';
import type {ProjectRecord} from '../shared/records';
import {pullReferenceDraft,pullReferenceDraftSchema,parsePullReferenceDraft} from '../shared/pullReferenceEditing';
import type {PullReference} from '../shared/hostedVerification';
import {api} from './api';
import {draftStorage} from './draftStorage';
import {useDefinitionRecovery,DefinitionRecoveryControls} from './useDefinitionRecovery';
export default function PullReferenceEditor({projectId,repository,increment,unavailable,busy,onBusyChange}:{projectId:string;repository?:string;increment:ProjectRecord;unavailable:boolean;busy:boolean;onBusyChange:(busy:boolean)=>void}){
 const qc=useQueryClient(),recovery=useDefinitionRecovery(projectId,'pull-references-'+increment.id,pullReferenceDraftSchema),{session,setSession}=recovery;
 const [error,setError]=useState(''),[message,setMessage]=useState('');
 const refs=increment.githubPullRequests??[];
 const mutation=useMutation({mutationFn:({revision,references}:{revision:string;references:PullReference[]})=>{
  if(draftStorage.read(projectId,increment.id).state!=='empty')throw Error('Resolve the record recovery draft before saving pull request associations.');
  return api.updatePullReferences(projectId,increment.id,revision,references);
 },onSuccess:async result=>{
  await qc.cancelQueries({queryKey:['records',projectId]});qc.setQueryData(['records',projectId],(old:Awaited<ReturnType<typeof api.list>>|undefined)=>old?{...old,records:old.records.map(r=>r.id===result.id?result:r)}:old);
  setSession(null);setError('');setMessage('Pull request associations saved. No remote lookup was performed.');
 },onError:e=>setError(e.message),onSettled:()=>{void qc.invalidateQueries({queryKey:['records',projectId]});}});
 const active=!!session||mutation.isPending;useLayoutEffect(()=>{onBusyChange(active);},[active,onBusyChange]);useLayoutEffect(()=>()=>onBusyChange(false),[onBusyChange]);
 useEffect(()=>{if(!active)return;const warn=(e:BeforeUnloadEvent)=>{e.preventDefault();e.returnValue='';};window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn);},[active]);
 const originalMatches=!!session&&JSON.stringify(session.original)===JSON.stringify(refs);
 const stale=!!session&&(unavailable||session.revision!==increment.revision||!originalMatches);
 const update=(index:number,patch:Partial<{repository:string;number:string}>)=>{setSession(s=>s?{...s,draft:s.draft.map((row,i)=>i===index?{...row,...patch}:row)}:s);setError('');};
 const save=(e:FormEvent)=>{e.preventDefault();if(!session||stale||mutation.isPending)return;const parsed=parsePullReferenceDraft(session.draft);if(!parsed.success){setError('Use unique owner/repository names and positive safe-integer pull request numbers (maximum five).');return;}mutation.mutate({revision:session.revision,references:parsed.data});};
 return <section className="pull-reference-editor" aria-label="Pull request associations">
 <button type="button" className="secondary" disabled={unavailable||busy||!recovery.canStart} onClick={()=>{setMessage('');setError('');setSession(pullReferenceDraft(increment.revision,refs));}}>Edit pull request associations</button>
 <DefinitionRecoveryControls recovery={recovery} disabled={mutation.isPending||(!session&&(busy||unavailable))} label="pull request association"/>
 {message&&<p role="status">{message}</p>}
 {session&&<form aria-label="Edit pull request associations" className="schema-form" onSubmit={save}>
 <p className="overview-note">Associate at most five explicit PRs. Saving changes this record only. Remote lookups remain separate and limited to the configured repository.</p>
 {stale&&<div role="alert" className="warning">The record changed or is unavailable. Your association draft is retained. {originalMatches&&!unavailable&&<button type="button" className="secondary" onClick={()=>{setSession(s=>s?{...s,revision:increment.revision}:s);setError('');}}>Review current record and keep associations</button>}{!originalMatches&&<p>The saved associations changed. Export or cancel, then reopen the current references.</p>}</div>}
 <fieldset disabled={mutation.isPending}>{session.draft.map((row,index)=><div key={index} className="pull-reference-row"><label>Repository {index+1}<input aria-label={'Repository '+(index+1)} value={row.repository} maxLength={220} onChange={e=>update(index,{repository:e.target.value})}/></label><label>PR number {index+1}<input aria-label={'PR number '+(index+1)} value={row.number} inputMode="numeric" maxLength={16} onChange={e=>update(index,{number:e.target.value})}/></label><button type="button" className="secondary" aria-label={'Remove association '+(index+1)} onClick={()=>setSession(s=>s?{...s,draft:s.draft.filter((_,i)=>i!==index)}:s)}>Remove</button></div>)}
 <button type="button" className="secondary" disabled={session.draft.length>=5} onClick={()=>setSession(s=>s?{...s,draft:[...s.draft,{repository:repository??'',number:''}]}:s)}>Add association</button></fieldset>
 {error&&<p role="alert" className="warning">{error}</p>}
 <div className="schema-form-actions"><button type="submit" className="primary" disabled={stale||mutation.isPending}>Save associations</button><button type="button" className="secondary" disabled={mutation.isPending} onClick={()=>{if(window.confirm('Discard unsaved pull request associations?')){setSession(null);setError('');}}}>Cancel associations</button></div>
 </form>}
 </section>;
}

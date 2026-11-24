import { useState } from 'react';
import { useQuery,useMutation,useQueryClient } from '@tanstack/react-query';
import { Bookmark, Plus, Trash2 } from 'lucide-react';
import type { SavedView,ViewInput } from '../shared/views';
import { api } from './api';
export default function SavedViews({projectId,current,active,onApply,onClear}:{projectId:string;current:Omit<ViewInput,'title'>|null;active:SavedView|null;onApply:(view:SavedView)=>void;onClear:()=>void}){
  const qc=useQueryClient();
  const query=useQuery({queryKey:['views',projectId],queryFn:()=>api.views(projectId),refetchInterval:5000});
  const [title,setTitle]=useState(''),[open,setOpen]=useState(false);
  const refresh=()=>{void qc.invalidateQueries({queryKey:['views',projectId]});};
  const mutation=useMutation({mutationFn:(action:'create'|'update'|'delete')=>{
    if(action==='delete'&&active)return api.removeView(projectId,active.id,active.revision);
    if(!current)throw new Error('Choose a record view');
    if(action==='update'&&active)return api.updateView(projectId,active.id,active.revision,{...current,title:title.trim()||active.title});
    return api.createView(projectId,{...current,title:title.trim()});
  },onSuccess:result=>{refresh();setOpen(false);setTitle('');if('id'in result)onApply(result);else onClear();}});
  const list=query.data?.views||[];
  return <section className="saved-views" aria-label="Saved views"><div className="saved-heading"><Bookmark size={14}/><span>SAVED VIEWS</span><button type="button" className="icon-button" aria-label="Save current view" disabled={!current||mutation.isPending} onClick={()=>{setTitle('');setOpen(v=>!v);}}><Plus size={15}/></button></div>
    {list.map(v=><button type="button" key={v.id} className={'nav-item '+(active?.id===v.id?'active':'')} disabled={mutation.isPending} onClick={()=>{mutation.reset();setOpen(false);onApply(v);}}><span>{v.title}</span><small>{v.mode}</small></button>)}
    {!query.isPending&&!list.length&&<p className="link-empty">Save a filtered workspace.</p>}
    {open&&<form className="save-view-form" onSubmit={e=>{e.preventDefault();mutation.mutate('create');}}><label>View name<input value={title} onChange={e=>setTitle(e.target.value)} required maxLength={80} placeholder="e.g. Release review"/></label><button type="submit" className="primary" disabled={!title.trim()||mutation.isPending||!current}>Save new view</button></form>}
    {active&&current&&<div className="saved-actions"><button className="secondary" disabled={mutation.isPending} onClick={()=>mutation.mutate('update')}>Update</button><button className="icon-button" aria-label="Delete saved view" disabled={mutation.isPending} onClick={()=>{if(window.confirm('Delete saved view? Records will not be changed.'))mutation.mutate('delete');}}><Trash2 size={15}/></button><button className="secondary" onClick={onClear}>Clear</button></div>}
    {query.error&&<p className="warning" role="alert">{query.error.message}</p>}
    {query.data?.errors.map(e=><p className="warning" key={e.file}>{e.file}: {e.message}</p>)}
    {mutation.error&&<p className="warning" role="alert">{mutation.error.message}</p>}
  </section>;
}

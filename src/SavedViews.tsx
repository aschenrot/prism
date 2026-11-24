import { useLayoutEffect,useRef,useState } from 'react';
import { useQuery,useMutation,useQueryClient } from '@tanstack/react-query';
import { Bookmark, Plus, Trash2 } from 'lucide-react';
import type { SavedView,ViewInput } from '../shared/views';
import { api } from './api';
import RouteLink from './RouteLink';
import { savedRoute,routeHash } from '../shared/routes';
export default function SavedViews({projectId,current,active,onApply,onClear,scope,disabled}:{projectId:string;current:Omit<ViewInput,'title'>|null;active:SavedView|null;onApply:(view:SavedView)=>void;onClear:()=>void;scope:string;disabled:boolean}){
  const qc=useQueryClient();
  const query=useQuery({queryKey:['views',projectId],queryFn:()=>api.views(projectId),refetchInterval:5000});
  const liveScope=useRef<string|null>(scope);useLayoutEffect(()=>{liveScope.current=scope;return()=>{liveScope.current=null;};},[scope]);
  const [title,setTitle]=useState(''),[open,setOpen]=useState(false);
  const refresh=()=>{void qc.invalidateQueries({queryKey:['views',projectId]});};
  const mutation=useMutation({mutationFn:async ({action}:{action:'create'|'update'|'delete';scope:string;activeId?:string}):Promise<SavedView|{ok:boolean}>=>{
    if(action==='delete'){if(!active)throw new Error('No saved view selected');return api.removeView(projectId,active.id,active.revision);}
    if(!current)throw new Error('Choose a record view');
    if(action==='update'){if(!active)throw new Error('No saved view selected');return api.updateView(projectId,active.id,active.revision,{...current,title:active.title});}
    return api.createView(projectId,{...current,title:title.trim()});
  },onSuccess:async (result,operation)=>{await qc.cancelQueries({queryKey:['views',projectId]});qc.setQueryData(['views',projectId],(old:Awaited<ReturnType<typeof api.views>>|undefined)=>old?{...old,views:'id'in result?[...old.views.filter(v=>v.id!==result.id),result]:old.views.filter(v=>v.id!==operation.activeId)}:old);refresh();if(liveScope.current!==operation.scope)return;setOpen(false);setTitle('');if('id'in result)onApply(result);else onClear();}});
  const list=query.data?.views||[];
  return <section className="saved-views" aria-label="Saved views"><div className="saved-heading"><Bookmark size={14}/><span>SAVED VIEWS</span><button type="button" className="icon-button" aria-label="Save current view" disabled={disabled||!current||mutation.isPending} onClick={()=>{setTitle('');setOpen(v=>!v);}}><Plus size={15}/></button></div>
    {list.map(v=><RouteLink key={v.id} className={'nav-item '+(active?.id===v.id?'active':'')} href={routeHash(savedRoute(projectId,v.id))} aria-current={active?.id===v.id?'page':undefined} onNavigate={()=>{if(!disabled&&!mutation.isPending){mutation.reset();setOpen(false);onApply(v);}}}><span>{v.title}</span><small>{v.mode}</small></RouteLink>)}
    {!query.isPending&&!list.length&&<p className="link-empty">Save a filtered workspace.</p>}
    {open&&<form className="save-view-form" onSubmit={e=>{e.preventDefault();if(disabled||mutation.isPending||!title.trim()||!current)return;mutation.mutate({action:'create',scope,activeId:active?.id});}}><label>View name<input value={title} onChange={e=>setTitle(e.target.value)} required maxLength={80} placeholder="e.g. Release review"/></label><button type="submit" className="primary" disabled={disabled||!title.trim()||mutation.isPending||!current}>Save new view</button></form>}
    {active&&current&&<div className="saved-actions"><button className="secondary" disabled={disabled||mutation.isPending} onClick={()=>mutation.mutate({action:'update',scope,activeId:active?.id})}>Update</button><button className="icon-button" aria-label="Delete saved view" disabled={disabled||mutation.isPending} onClick={()=>{if(window.confirm('Delete saved view? Records will not be changed.'))mutation.mutate({action:'delete',scope,activeId:active?.id});}}><Trash2 size={15}/></button><button className="secondary" disabled={disabled||mutation.isPending} onClick={onClear}>Clear</button></div>}
    {query.error&&<p className="warning" role="alert">{query.error.message}</p>}
    {query.data?.errors.map(e=><p className="warning" key={e.file}>{e.file}: {e.message}</p>)}
    {mutation.error&&<p className="warning" role="alert">{mutation.error.message}</p>}
  </section>;
}

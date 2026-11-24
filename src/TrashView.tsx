import { useQuery,useMutation,useQueryClient } from '@tanstack/react-query';
import { RotateCcw,Trash2 } from 'lucide-react';
import type { ProjectRecord } from '../shared/records';
import { api } from './api';
import Status from './Status';
export default function TrashView({projectId}:{projectId:string}){
  const qc=useQueryClient();
  const query=useQuery({queryKey:['trash',projectId],queryFn:()=>api.trash(projectId),refetchInterval:5000});
  const restore=useMutation({mutationFn:(record:ProjectRecord)=>api.restoreTrash(projectId,record.id,record.revision),onSettled:()=>{void qc.invalidateQueries({queryKey:['trash',projectId]});void qc.invalidateQueries({queryKey:['records',projectId]});}});
  const records=query.data?.records||[];
  return <section className="trash-view" aria-label="Recoverable records">
    <p className="overview-note">Trashed records retain their original Markdown and stable IDs. Restoration never overwrites an existing record. Links and review evidence are not deleted. Permanent deletion is not available.</p>
    {query.isPending&&<p role="status">Reading trash…</p>}
    {query.error&&<p role="alert" className="warning">{query.error.message}</p>}
    {query.data?.errors.map(e=><p key={e.file} className="warning" role="alert">{e.file}: {e.message}</p>)}
    {restore.error&&<p className="warning" role="alert">{restore.error.message}</p>}
    {restore.isSuccess&&<p className="trash-restored" role="status">Restored {restore.data.title}.</p>}
    {!query.isPending&&!query.error&&!records.length&&<div className="empty"><Trash2 size={28}/><h2>Trash is empty</h2><p>Records moved to trash will appear here.</p></div>}
    {records.length>0&&<div className="table-wrap"><table><thead><tr><th>Title</th><th>Type</th><th>Status</th><th>Actions</th></tr></thead><tbody>{records.map(r=><tr key={r.id}><td>{r.title}<small className="trash-id">{r.id}</small></td><td>{r.type}</td><td><Status value={r.status}/></td><td><button className="secondary" aria-label={'Restore '+r.title} disabled={restore.isPending} onClick={()=>restore.mutate(r)}><RotateCcw size={15}/> Restore</button></td></tr>)}</tbody></table></div>}
  </section>;
}

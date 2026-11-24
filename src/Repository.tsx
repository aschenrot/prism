import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, Code2, RefreshCw } from 'lucide-react';
import { api } from './api';
export default function Repository({projectId}:{projectId:string}){
  const [path,setPath]=useState(''),[filter,setFilter]=useState('');
  const index=useQuery({queryKey:['repository',projectId],queryFn:()=>api.repository(projectId),staleTime:30000});
  const file=useQuery({queryKey:['file',projectId,path],queryFn:()=>api.file(projectId,path),enabled:!!path});
  const files=(index.data?.files||[]).filter(f=>f.path.toLowerCase().includes(filter.toLowerCase()));
  return <section className="repository-panel">
    <div className="repository-tools"><label>Filter repository files<input value={filter} onChange={e=>setFilter(e.target.value)} placeholder="Search file paths…"/></label><button className="secondary" onClick={()=>{void index.refetch();if(path)void file.refetch();}}><RefreshCw size={14}/> Refresh</button></div>
    {index.isPending&&<p>Indexing repository…</p>}{index.error&&<p role="alert" className="warning">{index.error.message}</p>}
    {index.data?.truncated&&<p className="warning">Scan limit reached. Results are incomplete.</p>}
    <div className="repository-grid"><nav aria-label="Repository files" className="file-list">{files.map(f=><button key={f.path} className={'file-entry '+(path===f.path?'active':'')} onClick={()=>setPath(f.path)} aria-pressed={path===f.path}>{f.kind==='documentation'?<BookOpen size={14}/>:<Code2 size={14}/>}<span>{f.path}</span></button>)}
    {!index.isPending&&!files.length&&<p>No matching documentation or source files.</p>}</nav>
    <article className="file-preview"><div className="eyebrow">{path||'REPOSITORY PREVIEW'}</div>{!path&&<p>Select a file to inspect its original source. This is a read-only file browser, not generated API documentation.</p>}{path&&file.isPending&&<p>Loading…</p>}{file.error&&<p role="alert" className="warning">{file.error.message}</p>}{file.data&&<pre>{file.data.content}</pre>}</article></div>
  </section>;
}

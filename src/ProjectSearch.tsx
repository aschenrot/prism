import { useEffect,useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search,FileText,Code2 } from 'lucide-react';
import { api } from './api';
import RouteLink from './RouteLink';
export default function ProjectSearch({projectId,query,repository,disabled,onSubmit,onOpen,hrefFor}:{projectId:string;query:string;repository:boolean;disabled:boolean;onSubmit:(query:string)=>void;onOpen:(id:string)=>void;hrefFor:(id:string)=>string}){
 const [input,setInput]=useState(query),[path,setPath]=useState('');
 useEffect(()=>{setInput(query);setPath('');},[projectId,query]);
 const result=useQuery({queryKey:['project-search',projectId,query],queryFn:()=>api.search(projectId,query),enabled:!!query.trim(),retry:false,refetchOnWindowFocus:false});
 const file=useQuery({queryKey:['file',projectId,path],queryFn:()=>api.file(projectId,path),enabled:!!path,retry:false});
 const data=!result.isError?result.data:undefined;
 return <section className="project-search" aria-label="Project search">
  <form className="project-search-form" onSubmit={e=>{e.preventDefault();const next=input.trim();if(disabled||!next)return;setPath('');if(next===query)void result.refetch();else onSubmit(next);}}>
   <label>Search this project<input autoComplete="off" maxLength={300} value={input} onChange={e=>setInput(e.target.value)} placeholder="Title, property, note or file content…" /></label><button type="submit" className="primary" disabled={disabled||!input.trim()}><Search size={16}/> Search project</button>
   <button type="button" className="secondary" disabled={disabled||(!input&&!query)} onClick={()=>{setInput('');setPath('');onSubmit('');}}>Clear</button>
  </form>
  <p className="search-description">Search canonical saved records{repository?' and allowlisted repository files':''}. All terms must match. Unsaved drafts and trash are excluded. No external requests or persistent index.</p>
  {result.isFetching&&<p role="status">Searching project…</p>}
  {result.isError&&<p className="warning" role="alert">{result.error.message} Search did not complete.</p>}
  {!query&&<p>Enter terms to search the entire current project.</p>}
  {data&&!result.isFetching&&<>
   {(data.recordErrors>0||!data.schemaAvailable)&&<p className="warning">{data.recordErrors>0?data.recordErrors+' unreadable record(s). ':''}{!data.schemaAvailable?'Schema unavailable; stored property values are searched without configured labels.':''}</p>}
   <h2>Records <small>{data.recordMatches} matches</small></h2>
   {data.recordMatches>data.records.length&&<p>Showing the first {data.records.length} ranked results. Refine the search.</p>}
   {!data.records.length&&<p>No matching saved records.</p>}
   <div className="project-search-results">{data.records.map(hit=><article key={hit.id} className="search-result"><RouteLink href={hrefFor(hit.id)} onNavigate={()=>onOpen(hit.id)}><FileText size={15}/>{hit.title}</RouteLink><small>{hit.typeLabel} · {hit.id}</small>{hit.matches.map((m,i)=><p key={i}><strong>{m.field}: </strong>{m.excerpt}</p>)}</article>)}</div>
   {repository&&<><h2>Repository files <small>{data.fileMatches} matches</small></h2>
   {data.repository.state==='searched'&&<p className={data.repository.truncated?'warning':'search-description'}>{data.repository.scanned} of {data.repository.indexed} indexed files searched for content. {data.repository.unread} content reads skipped or unavailable. {data.repository.truncated?'Results may be incomplete.':''}</p>}
   {data.fileMatches>data.files.length&&<p>Showing the first {data.files.length} ranked results. Refine the search.</p>}
   {!data.files.length&&<p>No matching indexed repository files.</p>}
   <div className="project-search-results">{data.files.map(hit=><article key={hit.path} className="search-result"><button type="button" className="file-entry" disabled={!hit.previewAvailable} onClick={()=>setPath(hit.path)}><Code2 size={15}/>{hit.path}</button><small>{hit.kind}{!hit.previewAvailable?' · Content not read':''}</small>{hit.matches.map((m,i)=><p key={i}><strong>{m.field}: </strong>{m.excerpt}</p>)}</article>)}</div>
   {path&&<section className="search-file-preview" aria-label="Search file preview"><h3>{path}</h3><button className="secondary" onClick={()=>setPath('')}>Close preview</button>{file.isPending&&<p>Loading current file…</p>}{file.error&&<p role="alert" className="warning">{file.error.message}</p>}{file.data&&<pre>{file.data.content}</pre>}</section>}
   </>}
  </>}
 </section>;
}

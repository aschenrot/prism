import { useEffect, useState, type FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'motion/react';
import { Layers3, LayoutGrid, Columns3, Table2, Presentation, Search, Plus, ChevronLeft, ChevronRight, ArrowUpRight, CircleDot, X, Sparkles, FolderOpen, Command, AlertTriangle, BookOpen, ShieldCheck, Network, FileText } from 'lucide-react';
import { accents, editableSchema, priorities, statuses, types, type Editable, type ProjectRecord } from '../shared/records';
import { api } from './api';
import type { ProjectInfo } from '../shared/projects';
import { auditRecords } from '../shared/audit';
import Repository from './Repository';
import SavedViews from './SavedViews';
import { Knowledge,RecordLinks } from './Knowledge';
import { defaultFilters,selectRecords,modes,type Filters,type SavedView,type ViewInput } from '../shared/views';

const views = [{name:'Board',icon:Columns3},{name:'Table',icon:Table2},{name:'Gallery',icon:LayoutGrid},{name:'Slides',icon:Presentation},{name:'Wiki',icon:FileText},{name:'Relationships',icon:Network},{name:'Audit',icon:ShieldCheck},{name:'Repository',icon:BookOpen}] as const;
type View = typeof views[number]['name'];
const excerpt = (body:string) => body.trim().split('\n').find(line => line.trim() && !line.startsWith('#')) || 'No description yet.';
const statusClass = (status:string) => status === 'Ready' ? 'ready' : status === 'In progress' ? 'progress' : 'concept';
function Status({value}:{value:string}) { return <span className={'status '+statusClass(value)}><CircleDot size={12}/>{value}</span>; }
function Artwork({record}:{record:ProjectRecord}) {
  return <div className={'artwork '+record.accent} aria-hidden="true"><svg viewBox="0 0 300 160" fill="none">
    <circle cx="150" cy="80" r="62" stroke="currentColor" opacity=".25"/><circle cx="150" cy="80" r="46" stroke="currentColor" opacity=".5"/>
    <path d="M150 15 220 80 150 145 80 80Z M150 34 199 80 150 126 101 80Z" stroke="currentColor"/>
    <path d="M150 34 150 126 M101 80H199 M80 80 220 80" stroke="currentColor" opacity=".25"/>
    <circle cx="150" cy="80" r="12" fill="currentColor" opacity=".8"/>
  </svg><span>{record.type.toUpperCase()} / PRISM</span></div>;
}
function RecordCard({record,selected,onSelect,gallery=false}:{record:ProjectRecord;selected:boolean;onSelect:()=>void;gallery?:boolean}) {
  return <button className={'record-card '+(selected?'selected ':'')+(gallery?'gallery-card':'')} onClick={onSelect} aria-pressed={selected}>
    {gallery && <Artwork record={record}/>}<div className="card-content"><div className="card-kicker"><span className={'dot '+record.accent}/>{record.type}<ArrowUpRight size={14}/></div>
    <h3>{record.title}</h3><p>{excerpt(record.body)}</p><div className="card-footer"><span>{record.tags[0] || record.priority+' priority'}</span>{gallery ? <Status value={record.status}/> : <span>{record.priority}</span>}</div></div>
  </button>;
}
function Inspector({projectId,record,records,onSelect,onClose,onBusyChange}:{projectId:string;record:ProjectRecord;records:ProjectRecord[];onSelect:(id:string)=>void;onClose:()=>void;onBusyChange:(value:boolean)=>void}) {
  const qc=useQueryClient();
  const [draft,setDraft]=useState<Editable>(()=>editableSchema.parse(recordToEdit(record)));
  const [revision,setRevision]=useState(record.revision);
  const [saved,setSaved]=useState(()=>JSON.stringify(recordToEdit(record)));
  const dirty=JSON.stringify(draft)!==saved;
  const stale=record.revision!==revision;
  const update=<K extends keyof Editable>(key:K,value:Editable[K])=>setDraft(d=>({...d,[key]:value}));
  const reset=()=>{setDraft(recordToEdit(record));setRevision(record.revision);setSaved(JSON.stringify(recordToEdit(record)));};
  useEffect(()=>{if(stale&&!dirty){reset();}},[record.revision,dirty,revision]);
  const mutation=useMutation({mutationFn:()=>api.update(projectId,record.id,revision,{...draft,tags:draft.tags.map(t=>t.trim()).filter(Boolean),relationships:draft.relationships.map(t=>t.trim()).filter(Boolean)}),onSuccess:next=>{
    const value=recordToEdit(next);setDraft(value);setRevision(next.revision);setSaved(JSON.stringify(value));
    qc.setQueryData(['records',projectId],(old:Awaited<ReturnType<typeof api.list>>|undefined)=>old?{...old,records:old.records.map(r=>r.id===next.id?next:r)}:old);
    void qc.invalidateQueries({queryKey:['records',projectId]});
  }});
  useEffect(()=>{onBusyChange(dirty||mutation.isPending);return()=>onBusyChange(false);},[dirty,mutation.isPending,onBusyChange]);
  useEffect(()=>{if(!dirty&&!mutation.isPending)return;const warn=(event:BeforeUnloadEvent)=>{event.preventDefault();event.returnValue='';};window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn);},[dirty,mutation.isPending]);
  const close=()=>{if(!mutation.isPending&&(!dirty||window.confirm('Discard unsaved edits?')))onClose();};
  return <aside className="inspector"><div className="inspector-top"><span>RECORD DETAILS</span><button className="icon-button" title="Close inspector" disabled={mutation.isPending} onClick={close}><X size={17}/></button></div>
    <form onSubmit={e=>{e.preventDefault();mutation.mutate();}} className="editor">
      <fieldset disabled={mutation.isPending}>
      <label>Title<input value={draft.title} maxLength={160} required onChange={e=>update('title',e.target.value)}/></label>
      <div className="field-pair"><label>Type<select value={draft.type} onChange={e=>update('type',e.target.value as Editable['type'])}>{types.map(v=><option key={v}>{v}</option>)}</select></label>
      <label>Status<select value={draft.status} onChange={e=>update('status',e.target.value as Editable['status'])}>{statuses.map(v=><option key={v}>{v}</option>)}</select></label></div>
      <div className="field-pair"><label>Priority<select value={draft.priority} onChange={e=>update('priority',e.target.value as Editable['priority'])}>{priorities.map(v=><option key={v}>{v}</option>)}</select></label>
      <label>Accent<select value={draft.accent} onChange={e=>update('accent',e.target.value as Editable['accent'])}>{accents.map(v=><option key={v}>{v}</option>)}</select></label></div>
      <label>Tags <small>Comma separated</small><input value={draft.tags.join(',')} onChange={e=>update('tags',e.target.value.split(','))}/></label>
      <label>Notes <small>Markdown source</small><textarea rows={11} value={draft.body} onChange={e=>update('body',e.target.value)}/></label>
      <label>Add a relationship<select value="" onChange={e=>{if(e.target.value)update('relationships',[...draft.relationships,e.target.value]);}}><option value="">Choose a record…</option>{records.filter(r=>r.id!==record.id&&!draft.relationships.includes(r.id)).map(r=><option key={r.id} value={r.id}>{r.title} ({r.type})</option>)}</select></label>
      <div className="draft-links">{draft.relationships.filter(Boolean).map((id,i)=><div className="draft-link" key={id+'-'+i}><span>{records.find(r=>r.id===id)?.title||id}</span><button type="button" className="icon-button" aria-label={'Remove '+id} onClick={()=>update('relationships',draft.relationships.filter((_,j)=>j!==i))}><X size={13}/></button></div>)}</div>
      <label>Linked IDs <small>Advanced / comma separated</small><input value={draft.relationships.join(',')} onChange={e=>update('relationships',e.target.value.split(','))}/></label>
      </fieldset>
      {stale&&dirty&&<div className="warning" role="alert">Changed on disk. Copy any unsaved text before reloading.<button type="button" className="secondary" onClick={reset}>Reload record</button></div>}
      {mutation.error&&<p className="warning" role="alert">{mutation.error.message}</p>}
      <div className="save-row"><span>{dirty?'Unsaved changes':'Saved to disk'}</span><button className="primary" type="submit" disabled={!dirty||stale||mutation.isPending}>{mutation.isPending?'Saving…':'Save'}</button></div>
    </form><RecordLinks records={records} id={record.id} onSelect={onSelect}/><div className="record-id">ID / {record.id}</div>
  </aside>;
}
function recordToEdit(r:ProjectRecord):Editable {return {title:r.title,type:r.type,status:r.status,priority:r.priority,accent:r.accent,tags:r.tags,relationships:r.relationships,body:r.body};}
export default function App(){
  const query=useQuery({queryKey:['projects'],queryFn:api.projects});
  const [selected,setSelected]=useState<string|null>(null);
  const projects=query.data||[];
  const project=projects.find(p=>p.id===selected)||projects[0];
  if(query.isPending)return <div className="empty">Opening project registry…</div>;
  if(query.error)return <div role="alert" className="warning">{query.error.message}</div>;
  if(!project)return <div className="empty">No configured projects.</div>;
  return <Workspace key={project.id} project={project} projects={projects} onProjectChange={setSelected}/>;
}
function Workspace({project,projects,onProjectChange}:{project:ProjectInfo;projects:ProjectInfo[];onProjectChange:(id:string)=>void}) {
  const projectId=project.id;
  const [busy,setBusy]=useState(false);
  const qc=useQueryClient();
  const query=useQuery({queryKey:['records',projectId],queryFn:()=>api.list(projectId),refetchInterval:2500});
  const records=query.data?.records||[];
  const [view,setView]=useState<View>('Board'),[filter,setFilter]=useState<Filters['type']>('All records'),[search,setSearch]=useState(''),[selected,setSelected]=useState<string|null>(null),[slide,setSlide]=useState(0),[creating,setCreating]=useState(false),[newTitle,setNewTitle]=useState(''),[newType,setNewType]=useState<Editable['type']>('Idea');
  const [statusFilter,setStatusFilter]=useState<Filters['status']>('Any status'),[priorityFilter,setPriorityFilter]=useState<Filters['priority']>('Any priority'),[sort,setSort]=useState<Filters['sort']>('Title'),[savedView,setSavedView]=useState<SavedView|null>(null);
  const filters:Filters={type:filter,search,status:statusFilter,priority:priorityFilter,sort};
  const visible=selectRecords(records,filters);
  const currentView:Omit<ViewInput,'title'>|null=modes.includes(view as typeof modes[number])?{mode:view as typeof modes[number],filters}:null;
  const viewModified=!!savedView&&!!currentView&&(savedView.mode!==currentView.mode||JSON.stringify(savedView.filters)!==JSON.stringify(filters));
  const applySaved=(v:SavedView)=>{setSavedView(v);setView(v.mode);setFilter(v.filters.type);setSearch(v.filters.search);setStatusFilter(v.filters.status);setPriorityFilter(v.filters.priority);setSort(v.filters.sort);setSlide(0);};
  const clearSaved=()=>{setSavedView(null);setFilter(defaultFilters.type);setSearch('');setStatusFilter(defaultFilters.status);setPriorityFilter(defaultFilters.priority);setSort(defaultFilters.sort);setSlide(0);};
  const record=records.find(r=>r.id===selected);
  const active=visible[Math.min(slide,Math.max(0,visible.length-1))];
  useEffect(()=>{setSlide(n=>Math.min(n,Math.max(0,visible.length-1)));},[visible.length]);
  const create=useMutation({mutationFn:()=>api.create(projectId,newTitle,newType),onSuccess:r=>{void qc.invalidateQueries({queryKey:['records',projectId]});setSelected(r.id);clearSaved();setCreating(false);setNewTitle('');}});
  const select=(id:string)=>{if(selected===id)return;if(busy){window.alert('Save or close the current record before switching.');return;}setSelected(id);};
  const changeView=(v:View)=>{setView(v);setSlide(0);};
  const submit=(e:FormEvent)=>{e.preventDefault();if(!busy)create.mutate();};
  const findings=auditRecords(records);
  const switchProject=(id:string)=>{if(!busy&&!create.isPending&&!creating)onProjectChange(id);};
  useEffect(()=>{const handler=(e:KeyboardEvent)=>{if(view!=='Slides'||['INPUT','TEXTAREA','SELECT'].includes((e.target as HTMLElement)?.tagName))return;if(e.key==='ArrowRight')setSlide(n=>Math.min(n+1,Math.max(0,visible.length-1)));if(e.key==='ArrowLeft')setSlide(n=>Math.max(0,n-1));};window.addEventListener('keydown',handler);return()=>window.removeEventListener('keydown',handler);},[view,visible.length]);
  return <div className="shell">
    <aside className="sidebar"><div className="brand"><div className="brand-mark"><Layers3 size={22}/></div><div>prism<span>WORKSPACE / 01</span></div></div>
      <label className="project-label"><FolderOpen size={17}/><div><select aria-label="Active project" value={projectId} onChange={e=>switchProject(e.target.value)} disabled={busy||create.isPending||creating}>{projects.map(p=><option key={p.id} value={p.id}>{p.title}</option>)}</select><small>{project.storage==='repository'?'Connected repository':'Local workspace'}</small></div></label>
      <SavedViews projectId={projectId} current={currentView} active={savedView} onApply={applySaved} onClear={clearSaved}/>
      <div className="nav-label">COLLECTIONS</div><nav aria-label="Collections">{(['All records',...types] as const).map(t=><button key={t} className={'nav-item '+(filter===t?'active':'')} aria-pressed={filter===t} onClick={()=>{setSavedView(null);setFilter(t);setSlide(0);}}><span>{t}</span><small>{t==='All records'?records.length:records.filter(r=>r.type===t).length}</small></button>)}</nav>
      <div className="sidebar-bottom"><span className="local-dot"/> Local-first <span>v0.1</span></div>
    </aside>
    <main className="main"><header className="topbar"><div className="breadcrumb">Workspace <ChevronRight size={13}/> <strong>{filter}</strong></div><span className="disk-state"><span className="local-dot"/>{query.isError?'Offline / error':'Local project'}</span><button className="primary" disabled={busy} onClick={()=>setCreating(v=>!v)}><Plus size={16}/> New record</button></header>
      <div className="workspace-content"><div className="page-heading"><div><div className="eyebrow"><Sparkles size={13}/> PROJECT KNOWLEDGE</div><h1>{savedView?.title||(filter==='All records'?'Creative overview':filter)}</h1><p>{viewModified?'Saved view modified — update to persist changes.':'One collection. Every perspective.'}</p></div><div className="summary"><strong>{String(visible.length).padStart(2,'0')}</strong><span>RECORDS</span></div></div>
      {creating&&<form className="create-form" onSubmit={submit}><label>Record title<input autoFocus required maxLength={160} value={newTitle} onChange={e=>setNewTitle(e.target.value)}/></label><label>Type<select value={newType} onChange={e=>setNewType(e.target.value as Editable['type'])}>{types.map(t=><option key={t}>{t}</option>)}</select></label><button className="primary" disabled={create.isPending}>Create</button><button className="secondary" type="button" onClick={()=>setCreating(false)}>Cancel</button>{create.error&&<span role="alert">{create.error.message}</span>}</form>}
      <div className="toolbar"><div className="view-tabs" aria-label="View mode">{views.filter(v=>v.name!=='Repository'||project.storage==='repository').map(({name,icon:Icon})=><button key={name} className={view===name?'active':''} aria-pressed={view===name} onClick={()=>changeView(name)}><Icon size={16}/>{name}</button>)}</div><label className="search"><Search size={16}/><input aria-label="Search records" placeholder="Find anything…" maxLength={300} value={search} onChange={e=>{setSearch(e.target.value);setSlide(0);}}/></label></div>
      {currentView&&<div className="filter-row"><label>Status<select value={statusFilter} onChange={e=>{setStatusFilter(e.target.value as Filters['status']);setSlide(0);}}>{['Any status',...statuses].map(s=><option key={s}>{s}</option>)}</select></label><label>Priority<select value={priorityFilter} onChange={e=>{setPriorityFilter(e.target.value as Filters['priority']);setSlide(0);}}>{['Any priority',...priorities].map(s=><option key={s}>{s}</option>)}</select></label><label>Sort<select value={sort} onChange={e=>{setSort(e.target.value as Filters['sort']);setSlide(0);}}>{['Title','Priority','Status'].map(s=><option key={s}>{s}</option>)}</select></label><button className="secondary" onClick={clearSaved}>Reset filters</button></div>}
      {query.isPending&&<div className="empty">Opening your workspace…</div>}
      {query.error&&<div className="warning" role="alert"><AlertTriangle size={16}/> {query.error.message}</div>}
      {!!query.data?.errors.length&&<div className="warning" role="alert">{query.data.errors.map(e=><div key={e.file}>{e.file}: {e.message}</div>)}</div>}
      {!query.isPending&&!visible.length&&!['Audit','Repository','Wiki','Relationships'].includes(view)&&<div className="empty"><LayoutGrid size={30}/><h2>No matching records</h2><p>Create a record or change your filters.</p></div>}
      {(view==='Wiki'||view==='Relationships')&&<Knowledge key={view} mode={view} visible={visible} records={records} onEdit={select}/>}
      {view==='Repository'&&<Repository projectId={projectId}/>}
      {view==='Audit'&&<section className="audit-panel"><div className="audit-summary"><div><span className="eyebrow">RECORDS CHECKED</span><strong>{records.length}</strong></div><div><span className="eyebrow">REVIEW FINDINGS</span><strong>{findings.length}</strong></div></div><p className="audit-description">Deterministic checks of descriptions and record links. These findings are not a code quality or release readiness score.</p>{!findings.length&&!query.isPending&&!query.error&&<p>No record-level findings.</p>}{findings.map(f=><button key={f.id} className="audit-finding" onClick={()=>select(f.recordId)}><AlertTriangle size={17}/><span><strong>{f.title}</strong><small>{f.detail}</small></span><ArrowUpRight size={14}/></button>)}</section>}
      {!!visible.length&&view==='Board'&&<div className="board">{statuses.map(s=><section className="column" key={s}><div className="column-heading"><Status value={s}/><span>{visible.filter(r=>r.status===s).length}</span></div>{visible.filter(r=>r.status===s).map(r=><RecordCard key={r.id} record={r} selected={r.id===selected} onSelect={()=>select(r.id)}/>)}</section>)}</div>}
      {!!visible.length&&view==='Gallery'&&<div className="gallery">{visible.map(r=><RecordCard key={r.id} record={r} selected={r.id===selected} onSelect={()=>select(r.id)} gallery/>)}</div>}
      {!!visible.length&&view==='Table'&&<div className="table-wrap"><table><thead><tr><th>Title</th><th>Type</th><th>Status</th><th>Priority</th></tr></thead><tbody>{visible.map(r=><tr key={r.id} className={selected===r.id?'selected':''}><td><button onClick={()=>select(r.id)}><span className={'dot '+r.accent}/>{r.title}</button></td><td>{r.type}</td><td><Status value={r.status}/></td><td>{r.priority}</td></tr>)}</tbody></table></div>}
      {view==='Slides'&&active&&<section className="presentation" aria-label="Presentation"><div className="slide-stage"><AnimatePresence mode="wait" initial={false}><motion.div className={'slide '+active.accent} key={active.id} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}} transition={{duration:.22}}><div className="slide-copy"><div className="eyebrow">PRISM / {active.type.toUpperCase()}</div><h2>{active.title}</h2><p>{excerpt(active.body)}</p><Status value={active.status}/></div><Artwork record={active}/></motion.div></AnimatePresence></div><div className="slide-controls"><button className="icon-button" aria-label="Previous slide" disabled={slide<=0} onClick={()=>setSlide(n=>n-1)}><ChevronLeft/></button><span>{Math.min(slide+1,visible.length)} / {visible.length}</span><button className="icon-button" aria-label="Next slide" disabled={slide>=visible.length-1} onClick={()=>setSlide(n=>n+1)}><ChevronRight/></button><button className="secondary" onClick={()=>select(active.id)}>Edit record</button></div></section>}
      </div><footer className="footer"><span>PRISM / DEVELOPMENT PREVIEW</span><span><Command size={12}/> Records are stored as Markdown</span></footer>
    </main>{record&&<Inspector key={record.id} projectId={projectId} record={record} records={records} onSelect={select} onBusyChange={setBusy} onClose={()=>setSelected(null)}/>}
  </div>;
}

import { lazy, Suspense, useEffect, useRef, useState, type FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Layers3, LayoutGrid, Columns3, Table2, Presentation, Search, Plus, ChevronRight, ArrowUpRight, X, FolderOpen, Command, AlertTriangle, BookOpen, ShieldCheck, Network, FileText, Home, Target, Flag, ListChecks, Database, GitBranch, Gamepad2, MapPin, Users, Image, Maximize2, Minimize2 } from 'lucide-react';
import { accents, editableSchema, priorities, statuses, types, type Editable, type ProjectRecord } from '../shared/records';
import { api,ApiError } from './api';
import type { ProjectInfo } from '../shared/projects';
import { auditRecords } from '../shared/audit';
const Repository=lazy(()=>import('./Repository'));
import SavedViews from './SavedViews';
import { RecordLinks } from './RecordLinks';
import RelationshipEditor from './RelationshipEditor';
import Artwork from './Artwork';
import Status from './Status';
import { Changes,RecordEvidence } from './DeliveryEvidence';
import LocalVerification from './LocalVerification';
import { deliveryLabel,type GitHistory } from '../shared/delivery';
import WorkspaceOverview from './WorkspaceOverview';
import { destinationsFor,navigationFor,navigationForSaved,navigationMode,resetNavigationFilters,orderedModes,type DestinationMode } from '../shared/navigation';
import { Knowledge } from './Knowledge';
import { viewPreferences } from './viewPreferences';
import { draftStorage } from './draftStorage';
import { freshDraft,isDirty,type EditorDraft } from '../shared/editor';
import DraftConflict from './DraftConflict';
const SlideView=lazy(()=>import('./SlideView'));
import { selectRecords,modes,type Filters,type SavedView,type ViewInput } from '../shared/views';

const views = [{name:'Board',icon:Columns3},{name:'Table',icon:Table2},{name:'Gallery',icon:LayoutGrid},{name:'Slides',icon:Presentation},{name:'Wiki',icon:FileText},{name:'Relationships',icon:Network},{name:'Audit',icon:ShieldCheck},{name:'Repository',icon:BookOpen}] as const;
type View = DestinationMode;
const destinationIcons:Record<string,typeof Home>={overview:Home,strategy:Target,features:Layers3,requirements:Network,work:ListChecks,roadmap:Flag,quality:ShieldCheck,documentation:BookOpen,decisions:GitBranch,architecture:Network,repository:FileText,changes:GitBranch,presentations:Presentation,library:Database,gameplay:Gamepad2,world:MapPin,characters:Users,assets:Image};
const excerpt = (body:string) => body.trim().split('\n').find(line => line.trim() && !line.startsWith('#')) || 'No description yet.';
function RecordCard({record,selected,onSelect,gallery=false}:{record:ProjectRecord;selected:boolean;onSelect:()=>void;gallery?:boolean}) {
  return <button className={'record-card '+(selected?'selected ':'')+(gallery?'gallery-card':'')} onClick={onSelect} aria-pressed={selected}>
    {gallery && <Artwork record={record}/>}<div className="card-content"><div className="card-kicker"><span className={'dot '+record.accent}/>{record.type}<ArrowUpRight size={14}/></div>
    <h3>{record.title}</h3><p>{excerpt(record.body)}</p><div className="card-footer"><span>{record.tags[0] || record.priority+' priority'}</span>{gallery ? <Status value={record.status}/> : <span>{record.priority}</span>}</div></div>
  </button>;
}
function Inspector({projectId,record,recordUnavailable,records,onSelect,onClose,onBusyChange,expanded,onExpand,history,historySupported,historyLoading,historyError,onRefreshHistory}:{projectId:string;record:ProjectRecord;recordUnavailable:boolean;records:ProjectRecord[];onSelect:(id:string)=>void;onClose:()=>void;onBusyChange:(value:boolean)=>void;expanded:boolean;onExpand:()=>void;history:GitHistory|undefined;historySupported:boolean;historyLoading:boolean;historyError:boolean;onRefreshHistory:()=>void}) {
  const qc=useQueryClient();
  const [initial]=useState(()=>draftStorage.read(projectId,record.id));
  const [session,setSession]=useState<EditorDraft>(()=>initial.state==='available'?initial.draft:freshDraft(record));
  const token=useRef(initial.token);
  const [recovery,setRecovery]=useState<'stored'|'none'|'unavailable'|'conflict'|'invalid'>(initial.state==='available'?'stored':initial.state==='empty'?'none':initial.state);
  const [recoveryMessage,setRecoveryMessage]=useState(initial.state==='invalid'?'Existing recovery data is unreadable. It will not be overwritten automatically.':initial.state==='unavailable'?'Browser recovery storage is unavailable.':'');
  const [recovered,setRecovered]=useState(initial.state==='available');
  const [conflictResponse,setConflictResponse]=useState(false);
  const [validation,setValidation]=useState('');
  const draft=session.draft;
  const dirty=isDirty(session);
  const stale=record.revision!==session.baseRevision;
  const persist=(next:EditorDraft|null,allowInvalid=false)=>{
    if(recovery==='invalid'&&!allowInvalid)return false;
    const result=draftStorage.write(projectId,record.id,token.current,next);
    if(result.state==='stored'){
      token.current=result.token;setRecovery(next?'stored':'none');setRecoveryMessage('');return true;
    }
    setRecovery(result.state);setRecoveryMessage(result.message);return false;
  };
  const changeSession=(next:EditorDraft)=>{
    setSession(next);setValidation('');
    persist(isDirty(next)?next:null);
  };
  const update=<K extends keyof Editable>(key:K,value:Editable[K])=>changeSession({...session,draft:{...draft,[key]:value},updatedAt:new Date().toISOString()});
  const discard=()=>{
    if(!window.confirm(recordUnavailable?'Discard this draft? The canonical record is unavailable.':'Discard this draft and use the current disk record?'))return;
    if(!persist(null,true)&&!window.confirm('Recovery storage could not be cleared. Discard the in-memory edits anyway? Other stored recovery data will remain.'))return;
    setSession(freshDraft(record));setRecovered(false);setConflictResponse(false);setValidation('');
  };
  const exportDraft=()=>{
    const blob=new Blob([JSON.stringify({projectId,recordId:record.id,...session},null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob),link=document.createElement('a');
    link.href=url;link.download='prism-draft-'+record.id+'.json';document.body.appendChild(link);link.click();link.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  };
  const mutation=useMutation({mutationFn:(changes:Editable)=>api.update(projectId,record.id,session.baseRevision,changes),onSuccess:async next=>{
    await qc.cancelQueries({queryKey:['records',projectId]});
    // Never delete a newer draft written in another window.
    persist(null);setSession(freshDraft(next));setRecovered(false);setConflictResponse(false);setValidation('');
    qc.setQueryData(['records',projectId],(old:Awaited<ReturnType<typeof api.list>>|undefined)=>old?{...old,records:old.records.map(r=>r.id===next.id?next:r)}:old);
    void qc.invalidateQueries({queryKey:['records',projectId]});
  },onError:error=>{
    if(error instanceof ApiError&&error.status===409){setConflictResponse(true);void qc.invalidateQueries({queryKey:['records',projectId]});}
  }});
  useEffect(()=>{if(!recordUnavailable&&stale&&!dirty&&!mutation.isPending){setSession(freshDraft(record));setConflictResponse(false);}},[record.revision,dirty,session.baseRevision,mutation.isPending,recordUnavailable]);
  useEffect(()=>{onBusyChange(dirty||mutation.isPending);},[dirty,mutation.isPending,onBusyChange]);
  useEffect(()=>()=>onBusyChange(false),[onBusyChange]);
  useEffect(()=>{if(!dirty&&!mutation.isPending)return;const warn=(event:BeforeUnloadEvent)=>{event.preventDefault();event.returnValue='';};window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn);},[dirty,mutation.isPending]);
  const close=()=>{
    if(mutation.isPending)return;
    if(!dirty){onClose();return;}
    if(persist(session)){onClose();return;}
    // Don't close or silently discard work if persistence failed.
    setValidation('Recovery is not confirmed. Export a copy or resolve the storage problem before closing.');
  };
  const save=(e:FormEvent)=>{
    e.preventDefault();if(recordUnavailable||!dirty||stale||conflictResponse||mutation.isPending)return;
    const parsed=editableSchema.safeParse({...draft,tags:draft.tags.map(t=>t.trim()).filter(Boolean)});
    if(!parsed.success){setValidation(parsed.error.issues.map(i=>i.message).join('; '));return;}
    mutation.mutate(parsed.data);
  };
  return <aside className={"inspector"+(expanded?" expanded-inspector":"")} aria-label="Record editor"><div className="inspector-top"><span>{record.type.toUpperCase()} / RECORD DETAILS</span><div className="inspector-tools"><button type="button" className="icon-button" aria-label={expanded?"Collapse record editor":"Expand record editor"} onClick={onExpand}>{expanded?<Minimize2 size={17}/>:<Maximize2 size={17}/>}</button><button className="icon-button" title={dirty?"Keep recovery draft and close":"Close inspector"} disabled={mutation.isPending} aria-label="Close record editor" onClick={close}><X size={17}/></button></div></div>
    <form onSubmit={save} className="editor">
      {recordUnavailable&&<div className="warning" role="alert">The record file is missing or invalid. Your editor stays open. Export or keep the draft, or restore the file to resume saving.</div>}
      <div className="draft-state" role="status">{recovered&&dirty?'Recovered unsaved draft · ':''}{dirty?(recovery==='stored'?'Recovery copy stored locally':'Recovery not confirmed'):'No unsaved changes'}</div>
      {recoveryMessage&&<div className="warning" role="alert">{recoveryMessage}{recovery==='invalid'&&<button type="button" className="secondary" disabled={mutation.isPending} onClick={discard}>Discard unreadable recovery</button>}{recovery!=='invalid'&&dirty&&<button type="button" className="secondary" disabled={mutation.isPending} onClick={()=>persist(session)}>Retry recovery storage</button>}</div>}
      <fieldset disabled={mutation.isPending||(stale&&dirty)||conflictResponse}>
      <label>Title<input value={draft.title} maxLength={160} required onChange={e=>update('title',e.target.value)}/></label>
      <div className="field-pair"><label>Type<select value={draft.type} onChange={e=>update('type',e.target.value as Editable['type'])}>{types.map(v=><option key={v}>{v}</option>)}</select></label>
      <label>Status<select value={draft.status} onChange={e=>update('status',e.target.value as Editable['status'])}>{statuses.map(v=><option key={v}>{v}</option>)}</select></label></div>
      <div className="field-pair"><label>Priority<select value={draft.priority} onChange={e=>update('priority',e.target.value as Editable['priority'])}>{priorities.map(v=><option key={v}>{v}</option>)}</select></label>
      <label>Accent<select value={draft.accent} onChange={e=>update('accent',e.target.value as Editable['accent'])}>{accents.map(v=><option key={v}>{v}</option>)}</select></label></div>
      <label>Tags <small>Comma separated</small><input maxLength={4000} value={draft.tags.join(',')} onChange={e=>update('tags',e.target.value.split(','))}/></label>
      <label>Notes <small>Markdown source</small><textarea rows={11} maxLength={500000} value={draft.body} onChange={e=>update('body',e.target.value)}/></label>
      <RelationshipEditor sourceId={record.id} sourceType={draft.type} links={draft.relationships} records={records} onChange={links=>update('relationships',links)}/>
      </fieldset>
      {!recordUnavailable&&stale&&dirty&&<DraftConflict key={record.revision} session={session} record={record} disabled={mutation.isPending} onResolve={next=>{mutation.reset();setConflictResponse(false);changeSession(next);}}/>}
      {!recordUnavailable&&conflictResponse&&!stale&&<div className="warning" role="alert">Save rejected because the disk revision changed. Your draft remains intact.<button type="button" className="secondary" onClick={()=>{void qc.invalidateQueries({queryKey:['records',projectId]});}}>Refresh record</button></div>}
      {validation&&<p className="warning" role="alert">{validation}</p>}
      {dirty&&<div className="draft-actions"><button type="button" className="secondary" disabled={mutation.isPending} onClick={close}>Keep draft &amp; close</button><button type="button" className="secondary" disabled={mutation.isPending} onClick={exportDraft}>Export draft</button><button type="button" className="secondary" disabled={mutation.isPending} onClick={()=>{discard();mutation.reset();}}>Discard draft</button></div>}
      {mutation.error&&<p className="warning" role="alert">{mutation.error.message}</p>}
      <div className="save-row"><span>{dirty?'Unsaved changes':recordUnavailable?'Record unavailable':'Saved to disk'}</span><button className="primary" type="submit" disabled={recordUnavailable||!dirty||stale||conflictResponse||mutation.isPending}>{mutation.isPending?'Saving…':'Save'}</button></div>
    </form>{historySupported&&<RecordEvidence record={record} history={history} loading={historyLoading} error={historyError} onRefresh={onRefreshHistory}/>}<RecordLinks records={records} id={record.id} onSelect={onSelect}/><div className="record-id">ID / {record.id}</div>
  </aside>;
}
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
  const destinations=destinationsFor(project);
  const [navigation,setNavigation]=useState(()=>navigationFor(destinations[0],viewPreferences.preferred(projectId,destinations[0])));
  const {destinationId,view,filters,savedView}=navigation;
  const {type:filter,search,status:statusFilter,priority:priorityFilter,sort}=filters;
  const [expanded,setExpanded]=useState(false),[showSaved,setShowSaved]=useState(false);
  const destination=destinations.find(d=>d.id===destinationId)||destinations[0];
  const qc=useQueryClient();
  const query=useQuery({queryKey:['records',projectId],queryFn:()=>api.list(projectId),refetchInterval:2500});
  const records=query.data?.records||[];
  const historyQuery=useQuery({queryKey:['changes',projectId],queryFn:()=>api.changes(projectId),enabled:project.storage==='repository',refetchInterval:20000,staleTime:10000,retry:false});
  const history=historyQuery.data;
  const refreshHistory=()=>{void historyQuery.refetch();};
  const [selected,setSelected]=useState<string|null>(null),[slide,setSlide]=useState(0),[creating,setCreating]=useState(false),[newTitle,setNewTitle]=useState(''),[newType,setNewType]=useState<Editable['type']>('Idea');
  const changeFilter=<K extends keyof Filters>(key:K,value:Filters[K])=>{setNavigation(n=>({...n,filters:{...n.filters,[key]:value}}));setSlide(0);};
  const visible=selectRecords(records,filters);
  const currentView:Omit<ViewInput,'title'>|null=modes.includes(view as typeof modes[number])?{mode:view as typeof modes[number],filters}:null;
  const viewModified=!!savedView&&!!currentView&&(savedView.mode!==currentView.mode||Object.keys(filters).some(key=>filters[key as keyof Filters]!==savedView.filters[key as keyof Filters]));
  const applySaved=(v:SavedView)=>{setExpanded(false);setNavigation(navigationForSaved(v));setShowSaved(true);setSlide(0);};
  const clearSaved=()=>{setNavigation(n=>resetNavigationFilters(n,destination));setSlide(0);};
  const navigate=(id:string)=>{const next=destinations.find(d=>d.id===id);if(!next)return;setExpanded(false);setNavigation(navigationFor(next,viewPreferences.preferred(projectId,next)));setSlide(0);setShowSaved(false);if(next.type!=='All records')setNewType(next.type);};
  const [recordSnapshot,setRecordSnapshot]=useState<ProjectRecord|null>(null);
  const liveRecord=records.find(r=>r.id===selected);
  const record=liveRecord||(recordSnapshot?.id===selected?recordSnapshot:undefined);
  useEffect(()=>{if(liveRecord)setRecordSnapshot(previous=>previous?.id===liveRecord.id&&previous.revision===liveRecord.revision?previous:liveRecord);},[liveRecord]);
  const active=visible[Math.min(slide,Math.max(0,visible.length-1))];
  useEffect(()=>{setSlide(n=>Math.min(n,Math.max(0,visible.length-1)));},[visible.length]);
  const create=useMutation({mutationFn:()=>api.create(projectId,newTitle,newType),onSuccess:async r=>{await qc.cancelQueries({queryKey:['records',projectId]});qc.setQueryData(['records',projectId],(old:Awaited<ReturnType<typeof api.list>>|undefined)=>old?{...old,records:[...old.records.filter(item=>item.id!==r.id),r]}:old);setRecordSnapshot(r);setSelected(r.id);void qc.invalidateQueries({queryKey:['records',projectId]});setCreating(false);setNewTitle('');}});
  const select=(id:string)=>{if(selected===id)return;if(busy){window.alert('Save or close the current record to retain its recovery draft before switching.');return;}const next=records.find(r=>r.id===id);if(!next)return;setRecordSnapshot(next);setSelected(id);};
  const changeView=(v:View)=>{viewPreferences.remember(projectId,navigation,destination,v);setNavigation(n=>navigationMode(n,destination,v));setSlide(0);};
  const submit=(e:FormEvent)=>{e.preventDefault();if(!busy)create.mutate();};
  const findings=auditRecords(records);
  const projectSwitchBlocked=busy||create.isPending||creating;
  const projectSwitchHint=busy?'Save or keep the recovery draft and close to switch':create.isPending?'Creating a record…':creating?'Finish or cancel record creation':project.storage==='repository'?'Connected repository':'Local workspace';
  const switchProject=(id:string)=>{if(!projectSwitchBlocked)onProjectChange(id);};
  useEffect(()=>{const handler=(e:KeyboardEvent)=>{if(view!=='Slides'||['INPUT','TEXTAREA','SELECT'].includes((e.target as HTMLElement)?.tagName))return;if(e.key==='ArrowRight')setSlide(n=>Math.min(n+1,Math.max(0,visible.length-1)));if(e.key==='ArrowLeft')setSlide(n=>Math.max(0,n-1));};window.addEventListener('keydown',handler);return()=>window.removeEventListener('keydown',handler);},[view,visible.length]);
  return <div className={'shell workspace-shell'+(expanded&&record?' record-expanded':'')}>
    <aside className="sidebar"><div className="brand"><div className="brand-mark"><Layers3 size={22}/></div><div>prism<span>PROJECT WORKSPACE</span></div></div>
      <div className={'project-label project-switcher'+(projectSwitchBlocked?' switch-blocked':'')}><FolderOpen size={17} aria-hidden="true"/><div className="project-switcher-copy"><strong>{project.title}</strong><small id="project-switch-hint">{projectSwitchHint}</small></div><ChevronRight className="project-switcher-chevron" size={15} aria-hidden="true"/><select aria-label="Active project" aria-describedby="project-switch-hint" value={projectId} onChange={e=>switchProject(e.target.value)} disabled={projectSwitchBlocked}>{projects.map(p=><option key={p.id} value={p.id}>{p.title}</option>)}</select></div>
      <nav className="purpose-nav" aria-label="Project navigation">{['Workspace','Product','Game design','Management','Knowledge','Engineering','Studio'].map(group=>{
        const items=destinations.filter(d=>d.group===group&&d.id!=='library');if(!items.length)return null;
        return <div className="nav-group" key={group}>{group!=='Workspace'&&<div className="nav-label">{group}</div>}{items.map(d=>{const Icon=destinationIcons[d.id]||Database;return <button key={d.id} className={'nav-item purpose-item '+(destinationId===d.id?'active':'')} aria-current={destinationId===d.id?'page':undefined} onClick={()=>navigate(d.id)}><Icon size={16}/><span>{d.label}</span></button>;})}</div>;
      })}<div className="nav-group library-nav"><button className={'nav-item purpose-item '+(destinationId==='library'?'active':'')} aria-current={destinationId==='library'?'page':undefined} onClick={()=>navigate('library')}><Database size={16}/><span>Data library</span></button><button className="nav-item purpose-item" aria-expanded={showSaved} onClick={()=>setShowSaved(v=>!v)}><ChevronRight size={15} className={showSaved?'expanded-chevron':''}/><span>Saved views</span></button>{showSaved&&<SavedViews projectId={projectId} current={currentView} active={savedView} onApply={applySaved} onClear={clearSaved}/>}</div></nav>
      <div className="sidebar-bottom"><span className="local-dot"/> Local-first <span>v0.1</span></div>
    </aside>
    <main className="main"><header className="topbar"><div className="breadcrumb">Workspace <ChevronRight size={13}/> <strong>{destination.label}</strong></div><span className="disk-state"><span className="local-dot"/>{query.isError?'Offline / error':'Local project'}</span><button className="primary" disabled={busy} onClick={()=>{if(destination.type!=='All records')setNewType(destination.type);setCreating(v=>!v);}}><Plus size={16}/> {destination.type==='All records'?'New record':'New '+destination.type.toLowerCase()}</button></header>
      <div className="workspace-content"><div className="page-heading"><div><div className="eyebrow">{project.title} / {destination.group}</div><h1>{savedView?.title||destination.label}</h1><p>{viewModified?'Saved view modified — update to persist changes.':destination.description}</p></div>{currentView&&<div className="summary"><strong>{visible.length}</strong><span>RECORDS</span></div>}</div>
      {creating&&<form className="create-form" onSubmit={submit}><label>Record title<input autoFocus required maxLength={160} value={newTitle} onChange={e=>setNewTitle(e.target.value)}/></label><label>Type<select value={newType} onChange={e=>setNewType(e.target.value as Editable['type'])}>{types.map(t=><option key={t}>{t}</option>)}</select></label><button className="primary" disabled={create.isPending}>Create</button><button className="secondary" type="button" onClick={()=>setCreating(false)}>Cancel</button>{create.error&&<span role="alert">{create.error.message}</span>}</form>}
      {(currentView||destinationId==='quality')&&<div className="toolbar"><div className="view-tabs" aria-label="View mode">{orderedModes(destination).flatMap(mode=>views.filter(v=>v.name===mode)).map(({name,icon:Icon})=><button key={name} className={view===name?'active':''} aria-pressed={view===name} onClick={()=>changeView(name)}><Icon size={16}/>{name}</button>)}</div>{currentView&&<label className="search"><Search size={16}/><input aria-label="Search records" placeholder="Find anything…" maxLength={300} value={search} onChange={e=>{changeFilter('search',e.target.value);}}/></label>}</div>}
      {currentView&&<div className="filter-row">{destinationId==='library'&&<label>Collection<select value={filter} onChange={e=>{changeFilter('type',e.target.value as Filters['type']);}}>{['All records',...types].map(t=><option key={t}>{t}</option>)}</select></label>}<label>Status<select value={statusFilter} onChange={e=>{changeFilter('status',e.target.value as Filters['status']);}}>{['Any status',...statuses].map(s=><option key={s}>{s}</option>)}</select></label><label>Priority<select value={priorityFilter} onChange={e=>{changeFilter('priority',e.target.value as Filters['priority']);}}>{['Any priority',...priorities].map(s=><option key={s}>{s}</option>)}</select></label><label>Sort<select value={sort} onChange={e=>{changeFilter('sort',e.target.value as Filters['sort']);}}>{['Title','Priority','Status'].map(s=><option key={s}>{s}</option>)}</select></label><button className="secondary" onClick={clearSaved}>Reset filters</button></div>}
      {query.isPending&&<div className="empty">Opening your workspace…</div>}
      {query.error&&<div className="warning" role="alert"><AlertTriangle size={16}/> {query.error.message}</div>}
      {!!query.data?.errors.length&&<div className="warning" role="alert">{query.data.errors.map(e=><div key={e.file}>{e.file}: {e.message}</div>)}</div>}
      {!query.isPending&&!visible.length&&!['Overview','Audit','Repository','Changes','Wiki','Relationships'].includes(view)&&<div className="empty"><LayoutGrid size={30}/><h2>No matching records</h2><p>Create a record or change your filters.</p></div>}
      {view==='Overview'&&!query.isPending&&<WorkspaceOverview project={project} records={records} findings={findings.length} incomplete={!!query.error||!!query.data?.errors.length} history={history} historyError={historyQuery.isError} onSelect={select} onNavigate={navigate}/>}
      {(view==='Wiki'||view==='Relationships')&&<Knowledge key={destinationId+':'+(savedView?.id||'default')+':'+view} mode={view} visible={visible} records={records} onEdit={select}/>}
      {view==='Changes'&&<Changes history={history} loading={historyQuery.isFetching} error={historyQuery.isError} onRefresh={refreshHistory} records={records} onSelect={select}/>}
      {view==='Repository'&&<Suspense fallback={<div className="empty" role="status">Loading repository view…</div>}><Repository projectId={projectId}/></Suspense>}
      {view==='Audit'&&project.storage==='repository'&&<LocalVerification projectId={projectId} history={historyQuery.isError?undefined:history}/>}
      {view==='Audit'&&<section className="audit-panel"><div className="audit-summary"><div><span className="eyebrow">RECORDS CHECKED</span><strong>{records.length}</strong></div><div><span className="eyebrow">REVIEW FINDINGS</span><strong>{findings.length}</strong></div></div><p className="audit-description">Deterministic checks of descriptions and record links. These findings are not a code quality or release readiness score.</p>{!findings.length&&!query.isPending&&!query.error&&<p>No record-level findings.</p>}{findings.map(f=><button key={f.id} className="audit-finding" onClick={()=>select(f.recordId)}><AlertTriangle size={17}/><span><strong>{f.title}</strong><small>{f.detail}</small></span><ArrowUpRight size={14}/></button>)}</section>}
      {!!visible.length&&view==='Board'&&<div className="board">{statuses.map(s=><section className="column" key={s}><div className="column-heading"><Status value={s}/><span>{visible.filter(r=>r.status===s).length}</span></div>{visible.filter(r=>r.status===s).map(r=><RecordCard key={r.id} record={r} selected={r.id===selected} onSelect={()=>select(r.id)}/>)}</section>)}</div>}
      {!!visible.length&&view==='Gallery'&&<div className="gallery">{visible.map(r=><RecordCard key={r.id} record={r} selected={r.id===selected} onSelect={()=>select(r.id)} gallery/>)}</div>}
      {!!visible.length&&view==='Table'&&<div className="table-wrap"><table><thead><tr><th>Title</th><th>Type</th><th>Status</th><th>Priority</th>{destinationId==='work'&&project.storage==='repository'&&<th>Delivery</th>}</tr></thead><tbody>{visible.map(r=><tr key={r.id} className={'record-table-row'+(selected===r.id?' selected':'')} onClick={()=>select(r.id)}><td><button type="button" aria-pressed={selected===r.id} onClick={e=>{e.stopPropagation();select(r.id);}}><span className={'dot '+r.accent}/>{r.title}</button></td><td>{r.type}</td><td><Status value={r.status}/></td><td>{r.priority}</td>{destinationId==='work'&&project.storage==='repository'&&<td className="delivery-cell">{historyQuery.isError?'History unavailable':deliveryLabel(r,history)?.label||(history?.state==='available'?'No link found':historyQuery.isPending?'Loading…':'History unavailable')}</td>}</tr>)}</tbody></table></div>}
      {view==='Slides'&&active&&<Suspense fallback={<div className="empty" role="status">Loading presentation…</div>}><SlideView active={active} slide={slide} count={visible.length} onPrevious={()=>setSlide(n=>Math.max(0,n-1))} onNext={()=>setSlide(n=>Math.min(n+1,visible.length-1))} onEdit={()=>select(active.id)}/></Suspense>}
      </div><footer className="footer"><span>PRISM / DEVELOPMENT PREVIEW</span><span><Command size={12}/> Records are stored as Markdown</span></footer>
    </main>{record&&<Inspector key={record.id} projectId={projectId} record={record} recordUnavailable={!liveRecord} records={records} onSelect={select} onBusyChange={setBusy} onClose={()=>{setSelected(null);setRecordSnapshot(null);setExpanded(false);}} expanded={expanded} onExpand={()=>setExpanded(v=>!v)} history={history} historySupported={project.storage==='repository'} historyLoading={historyQuery.isFetching} historyError={historyQuery.isError} onRefreshHistory={refreshHistory}/>}
  </div>;
}

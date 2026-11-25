import { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState, type FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Layers3, LayoutGrid, Columns3, Table2, Presentation, Search, Plus, ChevronRight, ArrowUpRight, FolderOpen, Command, AlertTriangle, BookOpen, ShieldCheck, Network, FileText, Home, Target, Flag, ListChecks, Database, GitBranch, Gamepad2, MapPin, Users, Image, Maximize2, Minimize2, ArrowLeft, ArrowRight, Trash2 } from 'lucide-react';
import { accents, editableSchema, priorities, statuses, types, type Editable, type ProjectRecord, type PropertyChanges } from '../shared/records';
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
import BrowserVerification from './BrowserVerification';
import HostedVerification from './HostedVerification';
import { deliveryLabel,type GitHistory } from '../shared/delivery';
import WorkspaceOverview from './WorkspaceOverview';
import { destinationsFor,navigationFor,navigationForSaved,navigationMode,resetNavigationFilters,orderedModes,navigationGroups,type DestinationMode } from '../shared/navigation';
import { Knowledge } from './Knowledge';
import { viewPreferences } from './viewPreferences';
import { draftStorage } from './draftStorage';
import SchemaAdministration from './SchemaAdministration';
import { useProjectSchema,CustomPropertyFields,EntityTypeField } from './CustomProperties';
import { changedCustomKeys,customPropertyIssue,entityTypeIssue,entityTypeLabel,type CustomValue } from '../shared/customProperties';
import { AUTOSAVE_IDLE_MS,autosaveBlock } from '../shared/autosave';
import { emptyDraftHistory,endDraftGroup,recordDraftEdit,stepDraftHistory } from '../shared/draftHistory';
import { freshDraft,isDirty,changedSinceCheckpoint,type EditorDraft } from '../shared/editor';
import DraftConflict from './DraftConflict';
import NavigationToast from './NavigationToast';
import RecordPage from './RecordPage';
import RouteLink from './RouteLink';
import CollectionToolbar,{SortHeading} from './CollectionToolbar';
import TableColumns from './TableColumns';
import ProjectSearch from './ProjectSearch';
import TemplateAdministration from './TemplateAdministration';
import Inbox from './Inbox';
import StatusBoard from './StatusBoard';
import DependencyPlan from './DependencyPlan';
import Timeline from './Timeline';
import Traceability from './Traceability';
import RecoveryWorkspace from './RecoveryWorkspace';
import ProjectRegistrationGuide,{type RegistrationMode} from './ProjectRegistrationGuide';
import type { RecordTemplate } from '../shared/templates';
import { columnFor,defaultTableColumns,tableMinWidth,propertyColumnValue } from '../shared/tableColumns';
import RecordActions,{RecordCommandContext} from './RecordActions';
import RecordNotice,{type RecordNoticeData} from './RecordNotice';
import { PropertyCell,BulkPropertiesDialog,type PropertyResult } from './PropertyEditing';
import TrashView from './TrashView';
import TrashDialog from './TrashDialog';
import { relationshipsFor } from '../shared/relationships';
import { collectionRoute,recordRoute,savedRoute,routeHash,parentDestination,restoreCollection,contextFor } from '../shared/routes';
import { useWorkspaceHistory,type WorkspaceHistory } from './workspaceHistory';
const SlideView=lazy(()=>import('./SlideView'));
import { selectRecords,sortBy,sortDirection,modes,type Filters,type SavedView,type ViewInput } from '../shared/views';

const views = [{name:'Board',icon:Columns3},{name:'Table',icon:Table2},{name:'Gallery',icon:LayoutGrid},{name:'Slides',icon:Presentation},{name:'Wiki',icon:FileText},{name:'Relationships',icon:Network},{name:'Traceability',icon:ListChecks},{name:'Plan',icon:GitBranch},{name:'Timeline',icon:Flag},{name:'Audit',icon:ShieldCheck},{name:'Repository',icon:BookOpen},{name:'Search',icon:Search}] as const;
type View = DestinationMode;
const destinationIcons:Record<string,typeof Home>={overview:Home,strategy:Target,features:Layers3,requirements:Network,work:ListChecks,increments:Layers3,roadmap:Flag,quality:ShieldCheck,documentation:BookOpen,decisions:GitBranch,architecture:Network,repository:FileText,changes:GitBranch,presentations:Presentation,library:Database,trash:Trash2,gameplay:Gamepad2,world:MapPin,characters:Users,assets:Image,schemas:Database,templates:FileText,inbox:FileText,recovery:ShieldCheck};
const excerpt = (body:string) => body.trim().split('\n').find(line => line.trim() && !line.startsWith('#')) || 'No description yet.';
function RecordCard({record,typeLabel,selected,onSelect,onEdit,onTrash,href,gallery=false,disabled=false}:{record:ProjectRecord;typeLabel?:string;selected:boolean;onSelect:()=>void;onEdit:()=>void;onTrash:()=>void;href:string;gallery?:boolean;disabled?:boolean}) {
  return <div className="collection-card"><RouteLink className={'record-card '+(selected?'selected ':'')+(gallery?'gallery-card':'')} href={href} onNavigate={onSelect}>
    {gallery && <Artwork record={record}/>}<div className="card-content"><div className="card-kicker"><span className={'dot '+record.accent}/>{typeLabel??record.type}</div>
    <h3>{record.title}</h3><p>{excerpt(record.body)}</p><div className="card-footer"><span>{record.tags[0] || record.priority+' priority'}</span>{gallery ? <Status value={record.status}/> : <span>{record.priority}</span>}</div></div>
  </RouteLink><div className="collection-card-actions"><RecordActions record={record} onEdit={onEdit} onTrash={onTrash} disabled={disabled}/></div></div>;
}
function Inspector({projectId,record,recordUnavailable,records,onSelect,onClose,onBusyChange,expanded,onExpand,history,historySupported,historyLoading,historyError,onRefreshHistory}:{projectId:string;record:ProjectRecord;recordUnavailable:boolean;records:ProjectRecord[];onSelect:(id:string)=>void;onClose:()=>void;onBusyChange:(value:boolean)=>void;expanded:boolean;onExpand:()=>void;history:GitHistory|undefined;historySupported:boolean;historyLoading:boolean;historyError:boolean;onRefreshHistory:()=>void}) {
  const qc=useQueryClient();
  const [initial]=useState(()=>draftStorage.read(projectId,record.id));
  const [session,setSession]=useState<EditorDraft>(()=>initial.state==='available'?initial.draft:freshDraft(record));
  const [draftHistory,setDraftHistory]=useState(emptyDraftHistory);
  const [autosaveEnabled,setAutosaveEnabled]=useState(false),[autosaveMessage,setAutosaveMessage]=useState('');
  const autosaveTouchedAt=useRef(Date.now()),lastAutosaveAttempt=useRef<EditorDraft|null>(null);
  const [foreground,setForeground]=useState(()=>document.visibilityState==='visible');
  useEffect(()=>{const sync=()=>{if(document.visibilityState==='visible')autosaveTouchedAt.current=Date.now();setForeground(document.visibilityState==='visible');};document.addEventListener('visibilitychange',sync);return()=>document.removeEventListener('visibilitychange',sync);},[]);
  const pauseAutosave=(reason:string)=>{setAutosaveEnabled(false);setAutosaveMessage('Autosave paused: '+reason);};
  const token=useRef(initial.token);
  const checkpoint=useRef<EditorDraft|null>(initial.state==='available'?initial.draft:null);
  const [recovery,setRecovery]=useState<'stored'|'none'|'unavailable'|'conflict'|'invalid'>(initial.state==='available'?'stored':initial.state==='empty'?'none':initial.state);
  const [recoveryMessage,setRecoveryMessage]=useState(initial.state==='invalid'?'Existing recovery data is unreadable. It will not be overwritten automatically.':initial.state==='unavailable'?'Browser recovery storage is unavailable.':'');
  const [recovered,setRecovered]=useState(initial.state==='available');
  const [conflictResponse,setConflictResponse]=useState(false);
  const [validation,setValidation]=useState('');
  const draft=session.draft;
  const schemaQuery=useProjectSchema(projectId);
  const schema=!schemaQuery.isError&&schemaQuery.data?.state==='available'?schemaQuery.data:undefined;
  const customChanges=changedCustomKeys(session.base.customProperties,draft.customProperties);
  const entityChanged=(session.base.customTypeId??null)!==(draft.customTypeId??null)||!!draft.customTypeId&&draft.type!==session.base.type;
  const schemaStale=(customChanges.length>0||entityChanged)&&(!schema||session.schemaRevision!==schema.revision);
  const dirty=isDirty(session);
  const sessionChanged=changedSinceCheckpoint(session,checkpoint.current);
  const protectedEdit=dirty||sessionChanged;
  const stale=record.revision!==session.baseRevision;
  const persist=(next:EditorDraft|null,allowInvalid=false)=>{
    if(recovery==='invalid'&&!allowInvalid)return false;
    const result=draftStorage.write(projectId,record.id,token.current,next);
    if(result.state==='stored'){
      token.current=result.token;setRecovery(next?'stored':'none');setRecoveryMessage('');return true;
    }
    setRecovery(result.state);setRecoveryMessage(result.message);return false;
  };
  const applySession=(next:EditorDraft)=>{
    autosaveTouchedAt.current=Date.now();setSession(next);setValidation('');persist(isDirty(next)?next:null);if(autosaveEnabled)setAutosaveMessage(isDirty(next)?'Autosave waiting for idle valid changes.':'No unsaved changes.');
  };
  const changeSession=(next:EditorDraft,group?:string)=>{
    const now=Date.now();setDraftHistory(history=>recordDraftEdit(history,session,next,group,now));applySession(next);
  };
  const replaceSession=(next:EditorDraft)=>{setDraftHistory(emptyDraftHistory());applySession(next);if(autosaveEnabled)pauseAutosave('Review applied. Enable again or save manually.');};
  const update=<K extends keyof Editable>(key:K,value:Editable[K])=>changeSession({...session,...(key==='type'&&draft.customTypeId&&schema&&!schemaStale?{schemaRevision:schema.revision}:{}),draft:{...draft,[key]:value},updatedAt:new Date().toISOString()},key==='title'||key==='body'||key==='tags'?key:undefined);
  const changeCustom=(id:string,value:CustomValue|undefined)=>{
    if(!schema||schemaStale)return;
    const values={...draft.customProperties};
    if(value===undefined)delete values[id];else values[id]=value;
    changeSession({...session,schemaRevision:schema.revision,draft:{...draft,customProperties:Object.keys(values).length||session.base.customProperties!==undefined?values:undefined},updatedAt:new Date().toISOString()},['text','number','date'].includes(schema.definition.fields.find(f=>f.id===id)?.kind??'')?'property:'+id:undefined);
  };
  const changeEntity=(id:string|null)=>{
    if(!schema||schemaStale)return;
    const value=id===null&&session.base.customTypeId===undefined?undefined:id;
    changeSession({...session,schemaRevision:schema.revision,draft:{...draft,customTypeId:value},updatedAt:new Date().toISOString()});
  };
  const reviewSchema=()=>{
    if(!schema)return;
    replaceSession({...session,schemaRevision:schema.revision,updatedAt:new Date().toISOString()});
  };
  const restoreCustom=(id:string)=>{
    const values={...draft.customProperties};
    const before=session.base.customProperties?.[id];
    if(before===undefined)delete values[id];else values[id]=before;
    changeSession({...session,draft:{...draft,customProperties:Object.keys(values).length||session.base.customProperties!==undefined?values:undefined},updatedAt:new Date().toISOString()});
  };
  const discard=()=>{
    if(!window.confirm(recordUnavailable?'Discard this draft? The canonical record is unavailable.':'Discard this draft and use the current disk record?'))return;
    if(!persist(null,true)&&!window.confirm('Recovery storage could not be cleared. Discard the in-memory edits anyway? Other stored recovery data will remain.'))return;
    if(autosaveEnabled)pauseAutosave('Draft discarded.');checkpoint.current=null;setDraftHistory(emptyDraftHistory());setSession(freshDraft(record));setRecovered(false);setConflictResponse(false);setValidation('');
  };
  const exportDraft=()=>{
    const blob=new Blob([JSON.stringify({projectId,recordId:record.id,...session},null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob),link=document.createElement('a');
    link.href=url;link.download='prism-draft-'+record.id+'.json';document.body.appendChild(link);link.click();link.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  };
  const mutation=useMutation({mutationFn:({changes}:{changes:Editable;automatic:boolean})=>api.update(projectId,record.id,session.baseRevision,changes,session.schemaRevision),onSuccess:async (next,operation)=>{
    await qc.cancelQueries({queryKey:['records',projectId]});
    // Never delete a newer draft written in another window.
    const cleared=persist(null);if(operation.automatic){if(cleared)setAutosaveMessage('Autosaved to disk.');else pauseAutosave('Saved to disk, but recovery storage changed. Review it before continuing.');}else if(autosaveEnabled)setAutosaveMessage('Saved manually.');checkpoint.current=null;setDraftHistory(emptyDraftHistory());setSession(freshDraft(next));setRecovered(false);setConflictResponse(false);setValidation('');
    qc.setQueryData(['records',projectId],(old:Awaited<ReturnType<typeof api.list>>|undefined)=>old?{...old,records:old.records.map(r=>r.id===next.id?next:r)}:old);
    void qc.invalidateQueries({queryKey:['records',projectId]});
  },onError:(error,operation)=>{
    if(operation.automatic||autosaveEnabled)pauseAutosave('Save was not confirmed. Review the error before retrying.');
    if(error instanceof ApiError&&error.status===422)void schemaQuery.refetch();
    if(error instanceof ApiError&&error.status===409){setConflictResponse(true);void qc.invalidateQueries({queryKey:['records',projectId]});}
  }});
  useEffect(()=>{if(!recordUnavailable&&stale&&!dirty&&!mutation.isPending){setDraftHistory(emptyDraftHistory());setSession(freshDraft(record));setConflictResponse(false);}},[record.revision,dirty,session.baseRevision,mutation.isPending,recordUnavailable]);
  useLayoutEffect(()=>{onBusyChange(protectedEdit||mutation.isPending);},[protectedEdit,mutation.isPending,onBusyChange]);
  useLayoutEffect(()=>()=>onBusyChange(false),[onBusyChange]);
  useEffect(()=>{if(!protectedEdit&&!mutation.isPending)return;const warn=(event:BeforeUnloadEvent)=>{event.preventDefault();event.returnValue='';};window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn);},[protectedEdit,mutation.isPending]);
  const historyBlocked=mutation.isPending||stale||conflictResponse;
  const historyStep=(direction:'undo'|'redo')=>{
    if(historyBlocked)return;const next=stepDraftHistory(draftHistory,session,direction,new Date().toISOString());if(!next)return;
    setDraftHistory(next.history);applySession(next.session);
  };
  const cancel=()=>{
    if(mutation.isPending)return;
    if(!sessionChanged){onClose();return;}
    const previous=checkpoint.current;
    if(!window.confirm(previous?'Cancel changes made since opening this draft? The earlier draft will be retained.':'Cancel this edit and discard its unsaved changes?'))return;
    if(!persist(previous)){
      setValidation('Could not restore the earlier recovery state. Your current input is still available. Export it or resolve storage before leaving.');
      // A competing recovery copy must never be overwritten. The user may leave explicitly.
      if(!window.confirm('Recovery could not be restored. Close this editor anyway? Existing stored recovery data will remain unchanged.'))return;
    }
    onClose();
  };
  const close=()=>{
    if(mutation.isPending)return;
    if(!dirty){onClose();return;}
    if(persist(session)){onClose();return;}
    // Don't close or silently discard work if persistence failed.
    setValidation('Recovery is not confirmed. Export a copy or resolve the storage problem before closing.');
  };
  const attemptSave=(automatic:boolean)=>{
    if(recordUnavailable||!dirty||stale||conflictResponse||mutation.isPending)return;
    if(automatic){const stored=draftStorage.read(projectId,record.id);if(stored.state!=='available'||stored.token!==token.current){pauseAutosave('Recovery data changed. Resolve recovery before saving.');setRecovery(stored.state==='unavailable'?'unavailable':'conflict');setRecoveryMessage('Recovery data changed or became unavailable before autosave. Your draft remains in the editor.');return;}}
    if(schemaStale){setValidation('Review the current project schema before saving.');return;}
    if(entityChanged&&schema){const issue=entityTypeIssue(schema.definition,draft.type,draft.customTypeId,(session.base.customTypeId??null)!==(draft.customTypeId??null));if(issue){setValidation(issue);return;}}
    if(customChanges.length&&schema){for(const key of customChanges){const field=schema.definition.fields.find(f=>f.id===key),value=draft.customProperties?.[key];const issue=field?customPropertyIssue(field,draft.type,value,record.id,records.find(r=>r.id===value),draft.customTypeId):'Unconfigured property cannot be changed: '+key;if(issue){setValidation((field?field.label+': ':'')+issue);return;}}}
    const parsed=editableSchema.safeParse({...draft,tags:draft.tags.map(t=>t.trim()).filter(Boolean)});
    if(!parsed.success){setValidation(parsed.error.issues.map(i=>i.message).join('; '));return;}
    mutation.mutate({changes:parsed.data,automatic});
  };
  const save=(event:FormEvent)=>{event.preventDefault();attemptSave(false);};
  const autoBlock=autosaveBlock({dirty,recordUnavailable,stale,conflictResponse,schemaStale,recovery});
  useEffect(()=>{
    if(!autosaveEnabled||mutation.isPending)return;
    if(autoBlock){pauseAutosave(autoBlock);return;}
    if(!dirty||!foreground||lastAutosaveAttempt.current===session)return;
    const remaining=Math.max(0,AUTOSAVE_IDLE_MS-(Date.now()-autosaveTouchedAt.current));
    const timer=window.setTimeout(()=>{if(document.visibilityState==='visible'){lastAutosaveAttempt.current=session;attemptSave(true);}},remaining);
    return()=>window.clearTimeout(timer);
  },[autosaveEnabled,autoBlock,dirty,foreground,session,mutation.isPending,schema?.revision,records]);
  return <aside className={"inspector"+(expanded?" expanded-inspector":"")} aria-label="Record editor"><div className="inspector-top"><span>{record.type.toUpperCase()} / EDIT RECORD</span><div className="inspector-tools"><button type="button" className="icon-button" aria-label={expanded?"Collapse record editor":"Expand record editor"} onClick={onExpand}>{expanded?<Minimize2 size={17}/>:<Maximize2 size={17}/>}</button><button type="button" className="secondary" disabled={mutation.isPending} onClick={close}><ArrowLeft size={15}/>{dirty?"Keep draft & close":"Return to record"}</button></div></div>
    <h1 className="editor-record-title">{record.title}</h1>
    <form onSubmit={save} className="editor" onBlurCapture={()=>setDraftHistory(endDraftGroup)} onKeyDown={event=>{if(event.nativeEvent.isComposing||event.altKey||!(event.ctrlKey||event.metaKey))return;const key=event.key.toLowerCase();const direction=key==='z'?(event.shiftKey?'redo':'undo'):key==='y'&&!event.shiftKey?'redo':undefined;if(direction){event.preventDefault();historyStep(direction);}}}>
      {recordUnavailable&&<div className="warning" role="alert">The record file is missing or invalid. Your editor stays open. Export or keep the draft, or restore the file to resume saving.</div>}
      <div className="draft-state" role="status">{recovered&&dirty?'Recovered unsaved draft · ':''}{dirty?(recovery==='stored'?'Recovery copy stored locally':'Recovery not confirmed'):'No unsaved changes'}</div>
      {recoveryMessage&&<div className="warning" role="alert">{recoveryMessage}{recovery==='invalid'&&<button type="button" className="secondary" disabled={mutation.isPending} onClick={discard}>Discard unreadable recovery</button>}{recovery!=='invalid'&&dirty&&<button type="button" className="secondary" disabled={mutation.isPending} onClick={()=>persist(session)}>Retry recovery storage</button>}</div>}
      <div className="autosave-control"><label><input type="checkbox" checked={autosaveEnabled} disabled={mutation.isPending} onChange={event=>{if(event.target.checked){if(autoBlock){pauseAutosave(autoBlock);return;}autosaveTouchedAt.current=Date.now();lastAutosaveAttempt.current=null;setAutosaveEnabled(true);setAutosaveMessage('Autosave enabled for this editing session.');}else{setAutosaveEnabled(false);setAutosaveMessage('Autosave off. Save manually or keep your draft.');}}}/> Autosave valid changes</label><small>Off by default. When enabled, valid changes save after 1.8 seconds of inactivity while this tab is visible. Each save resets draft undo history.</small>{autosaveMessage&&<p role="status">{autosaveMessage}</p>}{autosaveEnabled&&dirty&&!foreground&&<p role="status">Autosave waits until this tab is visible.</p>}</div>
      <div className="draft-history-controls" role="group" aria-label="Draft editing history"><button type="button" className="secondary" disabled={historyBlocked||!draftHistory.past.length} onClick={()=>historyStep('undo')}>Undo draft edit</button><button type="button" className="secondary" disabled={historyBlocked||!draftHistory.future.length} onClick={()=>historyStep('redo')}>Redo draft edit</button><small>Unsaved edits only · resets on save, reload or conflict review</small></div>
      <fieldset disabled={mutation.isPending||(stale&&dirty)||conflictResponse}>
      <label>Title<input value={draft.title} maxLength={160} required onChange={e=>update('title',e.target.value)}/></label>
      <div className="field-pair"><label>Type<select aria-label="Type" value={draft.type} onChange={e=>update('type',e.target.value as Editable['type'])}>{types.map(v=><option key={v}>{v}</option>)}</select></label>
      <label>Status<select aria-label="Status" value={draft.status} onChange={e=>update('status',e.target.value as Editable['status'])}>{statuses.map(v=><option key={v}>{v}</option>)}</select></label></div>
      <div className="field-pair"><label>Priority<select aria-label="Priority" value={draft.priority} onChange={e=>update('priority',e.target.value as Editable['priority'])}>{priorities.map(v=><option key={v}>{v}</option>)}</select></label>
      <label>Accent<select aria-label="Accent" value={draft.accent} onChange={e=>update('accent',e.target.value as Editable['accent'])}>{accents.map(v=><option key={v}>{v}</option>)}</select></label></div>
      <label>Tags <small>Comma separated</small><input maxLength={4000} value={draft.tags.join(',')} onChange={e=>update('tags',e.target.value.split(','))}/></label>
      <label>Notes <small>Markdown source</small><textarea rows={11} maxLength={500000} value={draft.body} onChange={e=>update('body',e.target.value)}/></label>
      <EntityTypeField query={schemaQuery} role={draft.type} value={draft.customTypeId} disabled={schemaStale} onChange={changeEntity}/>
      <CustomPropertyFields query={schemaQuery} type={draft.type} entityId={draft.customTypeId} sourceId={record.id} values={draft.customProperties} base={session.base.customProperties} records={records} schemaStale={schemaStale} onChange={changeCustom} onReview={reviewSchema} onRestore={restoreCustom}/>
      <RelationshipEditor sourceId={record.id} sourceType={draft.type} links={draft.relationships} records={records} onChange={links=>update('relationships',links)}/>
      </fieldset>
      {!recordUnavailable&&stale&&dirty&&<DraftConflict key={record.revision} session={session} record={record} disabled={mutation.isPending} onResolve={next=>{mutation.reset();setConflictResponse(false);replaceSession(next);}}/>}
      {!recordUnavailable&&conflictResponse&&!stale&&<div className="warning" role="alert">Save rejected because the disk revision changed. Your draft remains intact.<button type="button" className="secondary" onClick={()=>{void qc.invalidateQueries({queryKey:['records',projectId]});}}>Refresh record</button></div>}
      {validation&&<p className="warning" role="alert">{validation}</p>}
      {dirty&&<div className="draft-actions"><button type="button" className="secondary" disabled={mutation.isPending} onClick={close}>Keep draft &amp; close</button><button type="button" className="secondary" disabled={mutation.isPending} onClick={exportDraft}>Export draft</button><button type="button" className="secondary" disabled={mutation.isPending} onClick={()=>{discard();mutation.reset();}}>Discard draft</button></div>}
      {mutation.error&&<p className="warning" role="alert">{mutation.error.message}</p>}
      <div className="save-row"><span>{dirty?'Unsaved changes':sessionChanged?'Editing session changed':recordUnavailable?'Record unavailable':'Saved to disk'}</span><div className="editor-save-actions"><button type="button" className="secondary" disabled={mutation.isPending} onClick={cancel}>Cancel</button><button className="primary" type="submit" disabled={recordUnavailable||!dirty||stale||conflictResponse||mutation.isPending||schemaStale}>{mutation.isPending?'Saving…':'Save'}</button></div></div>
    </form>{historySupported&&<RecordEvidence record={record} history={history} loading={historyLoading} error={historyError} onRefresh={onRefreshHistory}/>}<RecordLinks records={records} id={record.id} onSelect={onSelect} hrefFor={id=>routeHash(recordRoute(projectId,id))}/><div className="record-id">ID / {record.id}</div>
  </aside>;
}
export default function App(){
  const query=useQuery({queryKey:['projects'],queryFn:api.projects});
  const projects=query.data||[];
  if(query.isPending)return <div className="empty">Opening project registry…</div>;
  if(query.error&&!projects.length)return <div role="alert" className="warning">{query.error.message}</div>;
  if(!projects.length)return <div className="empty">No configured projects.</div>;
  return <RoutedWorkspace projects={projects}/>;
}
function RoutedWorkspace({projects}:{projects:ProjectInfo[]}){
  const router=useWorkspaceHistory(collectionRoute(projects[0].id));
  const project=projects.find(p=>p.id===router.route?.projectId);
  if(!project||!router.route)return <main className="route-missing"><h1>Workspace not found</h1><p>This address is invalid or its project is no longer configured.</p><button className="primary" onClick={()=>router.go(collectionRoute(projects[0].id))}>Open {projects[0].title}</button></main>;
  return <Workspace key={project.id} project={project} projects={projects} router={router}/>;
}
function Workspace({project,projects,router}:{project:ProjectInfo;projects:ProjectInfo[];router:WorkspaceHistory}) {
  const projectId=project.id;
  const route=router.route!;
  const hrefFor=(id:string)=>routeHash(recordRoute(projectId,id));
  const categoryHref=(id:string)=>routeHash(collectionRoute(projectId,id));
  const selected=route.kind==='record'?route.recordId:null;
  const [busy,setBusy]=useState(false),[editEntry,setEditEntry]=useState<string|null>(null);
  const [registrationGuide,setRegistrationGuide]=useState<RegistrationMode|null>(null);
  const editing=editEntry===router.entryKey;
  const destinations=destinationsFor(project);
  const qc=useQueryClient();
  const query=useQuery({queryKey:['records',projectId],queryFn:()=>api.list(projectId),refetchInterval:2500});
  const records=query.data?.records||[];
  const schemaQuery=useProjectSchema(projectId);
  const projectSchema=!schemaQuery.isError&&schemaQuery.data?.state==='available'?schemaQuery.data.definition:undefined;
  const liveRecord=records.find(r=>r.id===selected);
  const [recordSnapshot,setRecordSnapshot]=useState<ProjectRecord|null>(null);
  const record=liveRecord||(recordSnapshot?.id===selected?recordSnapshot:undefined);
  useEffect(()=>{if(liveRecord)setRecordSnapshot(previous=>previous?.id===liveRecord.id&&previous.revision===liveRecord.revision?previous:liveRecord);},[liveRecord]);
  const savedQuery=useQuery({queryKey:['views',projectId],queryFn:()=>api.views(projectId),enabled:route.kind==='saved'});
  const activeSaved=route.kind==='saved'?savedQuery.data?.views.find(v=>v.id===route.savedId):undefined;
  const destination=route.kind==='record'?parentDestination(destinations,record):destinations.find(d=>d.id===(route.kind==='saved'?'library':route.destinationId))||destinations[0];
  const routeMissing=route.kind==='collection'&&!destinations.some(d=>d.id===route.destinationId);
  const savedMissing=route.kind==='saved'&&!activeSaved&&!savedQuery.isPending;
  const navigation=restoreCollection(destination,viewPreferences.preferred(projectId,destination),route.kind==='record'?undefined:router.entry.context,activeSaved);
  const {destinationId,view,filters,savedView}=navigation;
  const deliveryDefault=destinationId==='work'&&project.storage==='repository';
  const columnIds=navigation.tableColumns??defaultTableColumns(deliveryDefault);
  const columns=columnIds.map(id=>columnFor(id,projectSchema));
  const recordsById=new Map(records.map(r=>[r.id,r]));
  // Freeze effective defaults for this entry even if preferences change later.
  useEffect(()=>{if(route.kind!=='record'&&!routeMissing&&!savedMissing&&(route.kind!=='saved'||activeSaved)&&!router.entry.context)router.replaceContext(contextFor(navigation));},[router.entryKey,router.entry.context,activeSaved,routeMissing,savedMissing]);
  const filteredEntity=projectSchema?.entityTypes?.find(e=>e.id===filters.entityType&&!e.retired&&(destination.type==='All records'||e.baseType===destination.type)&&(filters.type==='All records'||e.baseType===filters.type));
  const creationType=destination.type!=='All records'?destination.type:filters.type!=='All records'?filters.type:filteredEntity?.baseType;
  const [expanded,setExpanded]=useState(false),[showSaved,setShowSaved]=useState(route.kind==='saved');
  const historyQuery=useQuery({queryKey:['changes',projectId],queryFn:()=>api.changes(projectId),enabled:project.storage==='repository',refetchInterval:20000,staleTime:10000,retry:false});
  const history=historyQuery.data;
  const refreshHistory=()=>{void historyQuery.refetch();};
  const templateQuery=useQuery({queryKey:['templates',projectId],queryFn:()=>api.templates(projectId),enabled:route.kind!=='record',refetchInterval:5000});
  const [selectedTemplate,setSelectedTemplate]=useState<RecordTemplate|null>(null);
  const [creating,setCreating]=useState(false),[newTitle,setNewTitle]=useState(''),[newType,setNewType]=useState<Editable['type']>('Idea'),[newEntity,setNewEntity]=useState<string|undefined>(),[createSchemaRevision,setCreateSchemaRevision]=useState<string|undefined>();
  const availableEntities=projectSchema?.entityTypes?.filter(e=>e.baseType===newType&&!e.retired)??[];
  const currentSchemaRevision=!schemaQuery.isError&&schemaQuery.data?.state==='available'?schemaQuery.data.revision:undefined;
  const createSchemaStale=!!newEntity&&(!currentSchemaRevision||createSchemaRevision!==currentSchemaRevision||!availableEntities.some(e=>e.id===newEntity));
  const pageRef=useRef<HTMLDivElement>(null);
  const previousVisit=useRef<{trail:string;index:number}|null>(null);
  const pendingEdit=useRef<string|null>(null);
  // A deliberate collection Edit or Create opens the same recoverable editor directly.
  useLayoutEffect(()=>{setEditEntry(selected&&pendingEdit.current===selected?router.entryKey:null);pendingEdit.current=null;setExpanded(false);setCreating(false);setNewTitle('');setShowSaved(route.kind==='saved');},[router.entryKey]);
  const visible=selectRecords(records,filters);
  const slide=Math.min(router.entry.context?.slide??0,Math.max(0,visible.length-1));
  const active=visible[slide];
  const setSlide=(value:number)=>router.replaceContext({...contextFor(navigation),focus:router.entry.context?.focus,slide:Math.max(0,Math.min(value,Math.max(0,visible.length-1)))});
  const [recordNotice,setRecordNotice]=useState<RecordNoticeData|null>(null);
  const [bulkTargets,setBulkTargets]=useState<ProjectRecord[]|null>(null),[bulkResult,setBulkResult]=useState<PropertyResult|null>(null);
  const selectionScope=router.entryKey+':'+view+':'+JSON.stringify(filters);
  const [selection,setSelection]=useState<{scope:string;ids:string[]}>({scope:'',ids:[]});
  useLayoutEffect(()=>{setSelection({scope:selectionScope,ids:[]});},[selectionScope]);
  const selectedIds=new Set(selection.scope===selectionScope?selection.ids:[]);
  const selectedRecords=visible.filter(r=>selectedIds.has(r.id));
  const visibleIds=visible.map(r=>r.id).join(',');
  useLayoutEffect(()=>{setSelection(previous=>{if(previous.scope!==selectionScope)return previous;const available=new Set(visible.map(r=>r.id));const ids=previous.ids.filter(id=>available.has(id));return ids.length===previous.ids.length?previous:{...previous,ids};});},[selectionScope,visibleIds]);
  const allSelected=visible.length>0&&selectedRecords.length===visible.length;
  const partialSelected=selectedRecords.length>0&&!allSelected;
  const selectAllRef=useRef<HTMLInputElement>(null);
  useLayoutEffect(()=>{if(selectAllRef.current)selectAllRef.current.indeterminate=partialSelected;},[partialSelected,view]);
  const mergeRecords=async(updated:ProjectRecord[])=>{
    await qc.cancelQueries({queryKey:['records',projectId]});
    const changed=new Map(updated.map(r=>[r.id,r]));
    qc.setQueryData(['records',projectId],(old:Awaited<ReturnType<typeof api.list>>|undefined)=>old?{...old,records:[...old.records.filter(r=>!changed.has(r.id)),...updated]}:old);
  };
  const propertyUpdate=useMutation({mutationFn:async({targets,changes}:{targets:ProjectRecord[];changes:PropertyChanges;bulk:boolean})=>{
    const result:PropertyResult={updated:[],issues:[]};
    for(const target of targets){
      if(draftStorage.read(projectId,target.id).state!=='empty'){result.issues.push({id:target.id,title:target.title,message:'Recovery draft or unavailable recovery storage; resolve it before editing.'});continue;}
      try{result.updated.push(await api.updateProperties(projectId,target.id,target.revision,changes));}
      catch(error){result.issues.push({id:target.id,title:target.title,message:error instanceof ApiError&&error.status===409?error.message:'Update not confirmed. Refresh before retrying. '+(error instanceof Error?error.message:'')});}
    }
    return result;
  },onSuccess:async(result,input)=>{await mergeRecords(result.updated);if(input.bulk)setBulkResult(result);else if(result.issues.length)setRecordNotice({title:'Property not updated',message:result.issues[0].message,kind:'warning'});else setRecordNotice({title:'Property updated',message:result.updated[0].title+' saved.',kind:'success'});},onSettled:()=>{void qc.invalidateQueries({queryKey:['records',projectId]});}});
  const duplicate=useMutation({mutationFn:(target:ProjectRecord)=>api.duplicate(projectId,target.id,target.revision),onSuccess:async result=>{await mergeRecords([result]);pendingEdit.current=result.id;if(!router.go(recordRoute(projectId,result.id),undefined,true)){pendingEdit.current=null;setRecordNotice({title:'Record duplicated',message:result.title+' was created from saved content.',kind:'success'});}},onError:error=>setRecordNotice({title:'Duplication not confirmed',message:error.message,kind:'warning'}),onSettled:()=>{void qc.invalidateQueries({queryKey:['records',projectId]});}});
  const inboxUpdate=useMutation({mutationFn:({target,inbox}:{target:ProjectRecord;inbox:boolean})=>{if(draftStorage.read(projectId,target.id).state!=='empty')throw Error('Recovery draft or unavailable recovery storage; resolve it before triage.');return api.setInbox(projectId,target.id,target.revision,inbox);},onSuccess:async result=>{await mergeRecords([result]);setRecordNotice({title:result.inbox?'Added to inbox':'Triage completed',message:result.title+' · canonical record preserved.',kind:'success'});},onError:error=>setRecordNotice({title:'Inbox change not confirmed',message:error.message,kind:'warning'}),onSettled:()=>{void qc.invalidateQueries({queryKey:['records',projectId]});}});
  const workPending=propertyUpdate.isPending||duplicate.isPending||inboxUpdate.isPending;
  const controlsDisabled=busy||creating||workPending||!!bulkTargets||route.kind==='record'||query.isError;
  const toggleSelected=(id:string)=>{if(controlsDisabled)return;const ids=new Set(selectedRecords.map(r=>r.id));if(ids.has(id))ids.delete(id);else if(ids.size<100)ids.add(id);setSelection({scope:selectionScope,ids:[...ids]});};
  const changeProperty=(target:ProjectRecord,changes:PropertyChanges)=>{if(!controlsDisabled){setRecordNotice(null);propertyUpdate.mutate({targets:[target],changes,bulk:false});}};
  const copyRecordLink=async(target:ProjectRecord)=>{
    const url=new URL(hrefFor(target.id),window.location.href).href;
    try{await navigator.clipboard.writeText(url);setRecordNotice({title:'Link copied',message:target.title+' · record link copied.',kind:'success'});}
    catch{setRecordNotice({title:'Copy record link',message:'Clipboard unavailable. Select and copy the link below.',kind:'warning',copyValue:url});}
  };
  const duplicateRecord=(target:ProjectRecord)=>{
    if(busy||creating||workPending||bulkTargets||query.isError)return;
    if(draftStorage.read(projectId,target.id).state!=='empty'){setRecordNotice({title:'Resolve recovery first',message:'Save or discard the recovery draft before duplicating the saved record.',kind:'warning'});return;}
    setRecordNotice(null);duplicate.mutate(target);
  };
  const changeFilters=(next:Filters)=>{if(!controlsDisabled)router.replaceContext({...contextFor(navigation),filters:next,slide:0,focus:router.entry.context?.focus});};
  const currentView:Omit<ViewInput,'title'>|null=route.kind!=='record'&&!routeMissing&&!savedMissing&&(route.kind!=='saved'||!!activeSaved)&&modes.includes(view as typeof modes[number])?{mode:view as typeof modes[number],filters,...(navigation.tableColumns!==undefined||deliveryDefault?{tableColumns:columnIds}:{}),...(navigation.timeline?{timeline:navigation.timeline}:{})}:null;
  const viewModified=!!savedView&&!!currentView&&(savedView.mode!==currentView.mode||JSON.stringify(savedView.timeline)!==JSON.stringify(currentView.timeline)||JSON.stringify(savedView.tableColumns??defaultTableColumns())!==JSON.stringify(currentView.tableColumns??defaultTableColumns())||(sortDirection(filters)!==sortDirection(savedView.filters)||Object.keys({...savedView.filters,...filters}).some(key=>key!=='direction'&&filters[key as keyof Filters]!==savedView.filters[key as keyof Filters])));
  const applySaved=(v:SavedView)=>{if(router.go(savedRoute(projectId,v.id),contextFor(navigationForSaved(v))))setShowSaved(true);};
  const clearSaved=()=>{router.go(collectionRoute(projectId,'library'));};
  const resetFilters=()=>{const next=savedView?navigationForSaved(savedView):resetNavigationFilters(navigation,destination);router.replaceContext(contextFor(next));};
  const navigate=(id:string)=>{if(route.kind==='collection'&&route.destinationId===id)return;const next=destinations.find(d=>d.id===id);if(next)router.go(collectionRoute(projectId,next.id),contextFor(navigationFor(next,viewPreferences.preferred(projectId,next))));};
  const compatibleTemplates=(templateQuery.data?.templates??[]).filter(t=>!t.retired&&(!creationType||t.type===creationType)&&(!filteredEntity||t.customTypeId===filteredEntity.id));
  const templateStale=!!selectedTemplate&&(templateQuery.isError||!compatibleTemplates.some(t=>t.id===selectedTemplate.id&&t.revision===selectedTemplate.revision)||((!!selectedTemplate.customTypeId||!!Object.keys(selectedTemplate.customProperties??{}).length)&&(!currentSchemaRevision||createSchemaRevision!==currentSchemaRevision)));
  const create=useMutation({mutationFn:()=>selectedTemplate?api.instantiateTemplate(projectId,selectedTemplate.id,selectedTemplate.revision,newTitle,createSchemaRevision):api.create(projectId,newTitle,newType,newEntity,createSchemaRevision),onError:error=>{if(error instanceof ApiError&&error.status===422)void schemaQuery.refetch();},onSuccess:async r=>{await qc.cancelQueries({queryKey:['records',projectId]});qc.setQueryData(['records',projectId],(old:Awaited<ReturnType<typeof api.list>>|undefined)=>old?{...old,records:[...old.records.filter(item=>item.id!==r.id),r]}:old);setCreating(false);setNewTitle('');pendingEdit.current=r.id;if(!router.go(recordRoute(projectId,r.id),undefined,true))pendingEdit.current=null;void qc.invalidateQueries({queryKey:['records',projectId]});}});
  const select=(id:string)=>{if(records.some(r=>r.id===id))router.go(recordRoute(projectId,id));};
  const openEditor=(id:string)=>{if(!records.some(r=>r.id===id))return;pendingEdit.current=id;if(!router.go(recordRoute(projectId,id)))pendingEdit.current=null;};
  const beginCreate=()=>{if(!controlsDisabled){create.reset();setSelectedTemplate(null);setNewType(creationType||'Idea');setNewEntity(filteredEntity?.id);setCreateSchemaRevision(filteredEntity?currentSchemaRevision:undefined);setNewTitle('');setCreating(true);}};
  const changeView=(v:View)=>{if(controlsDisabled)return;viewPreferences.remember(projectId,navigation,destination,v);router.replaceContext(contextFor(navigationMode(navigation,destination,v)));};
  const submit=(e:FormEvent)=>{e.preventDefault();if(!busy&&!create.isPending&&!createSchemaStale&&!templateStale)create.mutate();};
  const [trashTarget,setTrashTarget]=useState<ProjectRecord|null>(null);
  const [trashProblem,setTrashProblem]=useState<string|undefined>();
  const trash=useMutation({mutationFn:(target:ProjectRecord)=>api.moveToTrash(projectId,target.id,target.revision),onSuccess:async target=>{await qc.cancelQueries({queryKey:['records',projectId]});qc.setQueryData(['records',projectId],(old:Awaited<ReturnType<typeof api.list>>|undefined)=>old?{...old,records:old.records.filter(r=>r.id!==target.id)}:old);setTrashTarget(null);setTrashProblem(undefined);if(route.kind==='record')router.go(collectionRoute(projectId,'trash'),undefined,true);else{setRecordNotice({title:'Record moved',message:'Moved '+target.title+' to Trash.',kind:'success',viewTrash:true});requestAnimationFrame(()=>pageRef.current?.focus({preventScroll:true}));}},onSettled:()=>{void qc.invalidateQueries({queryKey:['records',projectId]});void qc.invalidateQueries({queryKey:['trash',projectId]});}});
  const moveToTrash=(id:string)=>{
    const target=records.find(r=>r.id===id);
    if(!target||busy||creating||workPending||bulkTargets||create.isPending||trash.isPending||query.isError)return;
    trash.reset();setRecordNotice(null);setTrashTarget(target);
    setTrashProblem(draftStorage.read(projectId,target.id).state!=='empty'?'Resolve or export the recovery draft before moving this record to trash. Your recovery data has not been changed.':undefined);
  };
  const confirmTrash=()=>{
    if(!trashTarget||trash.isPending||busy)return;
    if(query.isError){setTrashProblem('Could not refresh the project records. Close this dialog and retry when storage is available.');return;}
    if(!records.some(r=>r.id===trashTarget.id&&r.revision===trashTarget.revision)){setTrashProblem('The saved record has changed. Close this dialog, review the latest version and try again.');return;}
    if(draftStorage.read(projectId,trashTarget.id).state!=='empty'){setTrashProblem('A recovery draft now exists. Resolve it before moving this record to trash.');return;}
    trash.mutate(trashTarget);
  };
  const trashIncoming=trashTarget?[...new Map(relationshipsFor(records,trashTarget.id).incoming.map(link=>[link.id,link.record])).values()]:[];
  const findings=auditRecords(records);
  const projectSwitchHint=project.storage==='repository'?'Connected repository':'Local workspace';
  const navigationGuard=workPending?'Record changes are being saved.':bulkTargets?'Close bulk editing before navigating.':trash.isPending?'Moving a record to trash.':trashTarget?'Close the record removal dialog before navigating.':busy?(editing?'Save, keep your draft, or cancel editing before leaving.':view==='Schemas'?'Save or cancel the schema definition before navigating.':view==='Templates'?'Save or cancel the template definition before navigating.':view==='Inbox'?'Finish or clear capture before navigating.':'Save or discard your review changes before navigating.'):create.isPending?'Record creation is still running.':creating?'Finish or cancel record creation.':'';
  // The same guard covers sidebar, related links, breadcrumbs and browser history.
  useLayoutEffect(()=>{router.setGuard(navigationGuard);if(!navigationGuard)router.clearNotice();return()=>router.setGuard('');},[navigationGuard]);
  useEffect(()=>{if(!creating&&!create.isPending&&!trash.isPending&&!workPending)return;const warn=(event:BeforeUnloadEvent)=>{event.preventDefault();event.returnValue='';};window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn);},[creating,create.isPending,trash.isPending,workPending]);
  const switchProject=(id:string)=>{if(id!==projectId&&projects.some(p=>p.id===id))router.go(collectionRoute(id));};
  const ready=!query.isPending&&(route.kind!=='saved'||!savedQuery.isPending);
  useLayoutEffect(()=>{
    if(!ready)return;
    const target=router.entry.scroll;
    pageRef.current?.focus({preventScroll:true});
    window.scrollTo(0,target);
    const frame=requestAnimationFrame(()=>window.scrollTo(0,target));
    return()=>cancelAnimationFrame(frame);
  },[router.entryKey,ready]);
  // Animate only actual route visits, not polling, filter changes or a dirty editor's state.
  useLayoutEffect(()=>{if(!ready)return;const previous=previousVisit.current;previousVisit.current={trail:router.entry.trail,index:router.entry.index};const node=pageRef.current;if(!previous||!node||typeof node.animate!=='function'||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;const backwards=previous.trail===router.entry.trail&&router.entry.index<previous.index;const animation=node.animate([{opacity:.72,transform:'translateX('+(backwards?-5:5)+'px)'},{opacity:1,transform:'translateX(0)'}],{duration:160,easing:'cubic-bezier(.2,.8,.2,1)'});return()=>animation.cancel();},[router.entryKey,ready]);
  useEffect(()=>{document.title=(record?.title||savedView?.title||destination.label)+' — '+project.title+' · Prism';},[record?.title,savedView?.title,destination.label,project.title]);
  useEffect(()=>{const handler=(e:KeyboardEvent)=>{if(creating||busy||workPending||bulkTargets||trashTarget||route.kind==='record'||view!=='Slides'||e.altKey||e.ctrlKey||e.metaKey||['INPUT','TEXTAREA','SELECT','BUTTON'].includes((e.target as HTMLElement)?.tagName))return;if(e.key==='ArrowRight')setSlide(slide+1);if(e.key==='ArrowLeft')setSlide(slide-1);};window.addEventListener('keydown',handler);return()=>window.removeEventListener('keydown',handler);},[route.kind,view,slide,visible.length,router.entryKey,router.entry.context,creating,busy,trashTarget,workPending,bulkTargets]);
  return <RecordCommandContext.Provider value={{duplicate:duplicateRecord,copy:target=>{void copyRecordLink(target);},triage:target=>{if(busy||creating||workPending||bulkTargets||query.isError||trash.isPending)return;setRecordNotice(null);inboxUpdate.mutate({target,inbox:!target.inbox});}}}><div className="shell workspace-shell routed-shell">
    <aside className="sidebar"><div className="brand"><div className="brand-mark"><Layers3 size={22}/></div><div>prism<span>PROJECT WORKSPACE</span></div></div>
      <div className="project-label project-switcher"><FolderOpen size={17} aria-hidden="true"/><div className="project-switcher-copy"><strong>{project.title}</strong><small id="project-switch-hint">{projectSwitchHint}</small></div><ChevronRight className="project-switcher-chevron" size={15} aria-hidden="true"/><select aria-label="Active project" aria-describedby="project-switch-hint" value={projectId} onChange={e=>{const value=e.currentTarget.value;if(value===":add"||value===":connect"||value===":manage"){e.currentTarget.value=projectId;setRegistrationGuide(value===":add"?"create":value===":connect"?"connect":"manage");}else switchProject(value);}}>{projects.map(p=><option key={p.id} value={p.id}>{p.title}</option>)}<optgroup label="Project management"><option value=":add">Create project…</option><option value=":connect">Connect existing project…</option><option value=":manage">Manage projects…</option></optgroup></select></div>
      {registrationGuide&&<ProjectRegistrationGuide mode={registrationGuide} projects={projects} blocked={navigationGuard} onClose={()=>setRegistrationGuide(null)}/>}
      <nav className="purpose-nav" aria-label="Project navigation">{navigationGroups.map(group=>{
        const items=destinations.filter(d=>d.group===group&&d.id!=='library'&&d.id!=='trash');if(!items.length)return null;
        return <div className="nav-group" key={group}>{group!=='Workspace'&&<div className="nav-label">{group}</div>}{items.map(d=>{const Icon=destinationIcons[d.id]||Database;return <RouteLink key={d.id} className={'nav-item purpose-item '+(destinationId===d.id?'active':'')} aria-current={destinationId===d.id?(route.kind==='record'?'location':'page'):undefined} href={categoryHref(d.id)} onNavigate={()=>navigate(d.id)}><Icon size={16}/><span>{d.label}</span></RouteLink>;})}</div>;
      })}<div className="nav-group library-nav"><RouteLink className={'nav-item purpose-item '+(destinationId==='library'?'active':'')} aria-current={destinationId==='library'?(route.kind==='collection'?'page':'location'):undefined} href={categoryHref('library')} onNavigate={()=>navigate('library')}><Database size={16}/><span>Data library</span></RouteLink><button className="nav-item purpose-item" aria-expanded={showSaved} onClick={()=>setShowSaved(v=>!v)}><ChevronRight size={15} className={showSaved?'expanded-chevron':''}/><span>Saved views</span></button>{showSaved&&<SavedViews projectId={projectId} current={currentView} active={savedView} onApply={applySaved} onClear={clearSaved} scope={router.entryKey} disabled={busy||creating||workPending||!!bulkTargets}/>}</div></nav>
      <RouteLink className={'nav-item purpose-item trash-nav '+(destinationId==='trash'?'active':'')} href={categoryHref('trash')} onNavigate={()=>navigate('trash')} aria-current={destinationId==='trash'?'page':undefined}><Trash2 size={16}/><span>Trash</span></RouteLink>
      <div className="sidebar-bottom"><span className="local-dot"/> Local-first <span>v0.1</span></div>
    </aside>
    <main className="main"><header className="topbar routed-topbar">
      <div className="history-controls" aria-label="Navigation history"><button className="icon-button" type="button" aria-label="Back" title="Back" disabled={!router.canBack} onClick={router.back}><ArrowLeft size={18}/></button><button className="icon-button" type="button" aria-label="Forward" title="Forward" disabled={!router.canForward} onClick={router.forward}><ArrowRight size={18}/></button></div>
      <nav className="breadcrumb" aria-label="Breadcrumb">{route.kind==='collection'&&destinationId==='overview'?<strong aria-current="page">{project.title}</strong>:<RouteLink href={categoryHref('overview')} onNavigate={()=>navigate('overview')}>{project.title}</RouteLink>}{!(route.kind==='collection'&&destinationId==='overview')&&<><ChevronRight size={13}/>{route.kind==='collection'?<strong aria-current="page">{destination.label}</strong>:<><RouteLink href={categoryHref(destination.id)} onNavigate={()=>navigate(destination.id)}>{destination.label}</RouteLink><ChevronRight size={13}/><strong aria-current="page" title={record?.title||savedView?.title}>{record?.title||savedView?.title||(route.kind==='record'?'Record':'Saved view')}</strong></>}</>}</nav>
      <span className="disk-state"><span className="local-dot"/>{query.isError?'Offline / error':'Local project'}</span>
    </header>
    <NavigationToast message={router.notice} onDismiss={router.clearNotice}/>
    {!router.notice&&recordNotice&&<RecordNotice notice={recordNotice} onDismiss={()=>setRecordNotice(null)} onViewTrash={()=>{if(route.kind==='collection'&&route.destinationId==='trash'){setRecordNotice(null);return;}if(router.go(collectionRoute(projectId,'trash')))setRecordNotice(null);}}/>}
    {bulkTargets&&<BulkPropertiesDialog targets={bulkTargets} pending={propertyUpdate.isPending} result={bulkResult} onApply={changes=>{if(!propertyUpdate.isPending&&!bulkResult){if(query.isError){setBulkResult({updated:[],issues:bulkTargets.map(r=>({id:r.id,title:r.title,message:'Project records could not be refreshed; no update attempted.'}))});return;}propertyUpdate.mutate({targets:bulkTargets,changes,bulk:true});}}} onClose={()=>{if(!propertyUpdate.isPending){setBulkTargets(null);setBulkResult(null);setSelection({scope:selectionScope,ids:[]});}}}/>}
    {trashTarget&&<TrashDialog record={trashTarget} incoming={trashIncoming} incomplete={!!query.data?.errors.length||query.isError} blocked={trashProblem} error={trash.error?.message} pending={trash.isPending} onCancel={()=>{if(!trash.isPending){setTrashTarget(null);setTrashProblem(undefined);trash.reset();}}} onConfirm={confirmTrash}/>}
      <div className="workspace-content" ref={pageRef} tabIndex={-1} aria-label={record?.title||savedView?.title||destination.label}>
      {route.kind==='record'&&query.error&&<p className="warning" role="alert">Could not refresh the record: {query.error.message}</p>}
      {route.kind==='record'?(query.isPending?<div className="empty" role="status">Opening record…</div>:record?<>{editing?<Inspector key={record.id} projectId={projectId} record={record} recordUnavailable={!liveRecord} records={records} onSelect={select} onBusyChange={setBusy} onClose={()=>{setEditEntry(null);setExpanded(false);router.clearNotice();window.scrollTo(0,0);requestAnimationFrame(()=>pageRef.current?.focus({preventScroll:true}));}} expanded={expanded} onExpand={()=>setExpanded(v=>!v)} history={history} historySupported={project.storage==='repository'} historyLoading={historyQuery.isFetching} historyError={historyQuery.isError} onRefreshHistory={refreshHistory}/>:<RecordPage key={record.id} projectId={projectId} githubRepository={project.githubRepository} record={record} records={records} incomplete={!!query.error||!!query.data?.errors.length} unavailable={!liveRecord} onOpen={select} hrefFor={hrefFor} onBusyChange={setBusy} busy={busy||trash.isPending||workPending} onTrash={()=>moveToTrash(record.id)} trashError={trash.variables?.id===record.id?trash.error?.message:undefined} onEdit={()=>{if(busy||trash.isPending||workPending)return;setEditEntry(router.entryKey);window.scrollTo(0,0);requestAnimationFrame(()=>pageRef.current?.focus({preventScroll:true}));}} repository={project.storage==='repository'} history={history} historyLoading={historyQuery.isFetching} historyError={historyQuery.isError} onRefresh={refreshHistory}/>}</>:<div className="empty"><h1>Record unavailable</h1><p>The record could not be found or read in this project.</p><button className="secondary" onClick={()=>navigate('library')}>Open Data library</button></div>):routeMissing||savedMissing?<div className="empty"><h1>{routeMissing?'Category unavailable':'Saved view unavailable'}</h1><p>{route.kind==='saved'&&savedQuery.error?savedQuery.error.message:'The address no longer matches an available destination.'}</p><button className="secondary" onClick={()=>navigate('overview')}>Return to Overview</button></div>:route.kind==='saved'&&!activeSaved?<div className="empty" role="status">Opening saved view…</div>:<>
      <div className="page-heading"><div><div className="eyebrow">{project.title} / {destination.group}</div><h1>{savedView?.title||destination.label}</h1><p>{viewModified?'Saved view modified — update to persist changes.':destination.description}</p></div>{currentView&&<div className="summary"><strong>{visible.length}</strong><span>RECORDS</span></div>}</div>
      {(currentView||destinationId==='quality'||(destinationId==='library'&&view==='Search'))&&<div className="toolbar"><div className="view-tabs" aria-label="View mode">{orderedModes(destination).flatMap(mode=>views.filter(v=>v.name===mode)).map(({name,icon:Icon})=><button key={name} className={view===name?'active':''} aria-pressed={view===name} disabled={controlsDisabled} onClick={()=>changeView(name)}><Icon size={16}/>{name}</button>)}</div></div>}
      <div className="collection-controls-slot">{currentView&&<CollectionToolbar scope={router.entryKey+':'+router.entry.hash} filters={filters} entityTypes={projectSchema?.entityTypes} allowType={destinationId==='library'} disabled={controlsDisabled||create.isPending} creating={creating} newLabel={filteredEntity?'New '+filteredEntity.label:creationType?'New '+creationType.toLowerCase():'New record'} onChange={changeFilters} onReset={resetFilters} onCreate={beginCreate}/>}</div>
      {creating&&<form className="create-form" onSubmit={submit}>{templateQuery.isError&&<span role="alert">Templates unavailable. You can still create a blank record.</span>}{(compatibleTemplates.length>0||selectedTemplate)&&<label>Template<select aria-label="Record template" disabled={create.isPending} value={selectedTemplate?.id??''} onChange={e=>{const t=compatibleTemplates.find(t=>t.id===e.target.value);setSelectedTemplate(t??null);setNewType(t?.type??creationType??'Idea');setNewEntity(t?.customTypeId??filteredEntity?.id??undefined);setCreateSchemaRevision(currentSchemaRevision);if(t)setNewTitle(t.title);}}><option value="">Blank record</option>{selectedTemplate&&!compatibleTemplates.some(t=>t.id===selectedTemplate.id)&&<option value={selectedTemplate.id}>Unavailable template</option>}{compatibleTemplates.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select></label>}{templateStale&&<div role="alert" className="warning">Template or schema changed. Review the current template before creating. {compatibleTemplates.some(t=>t.id===selectedTemplate?.id)&&<button type="button" className="secondary" onClick={()=>{const t=compatibleTemplates.find(t=>t.id===selectedTemplate?.id);if(t){setSelectedTemplate(t);setNewType(t.type);setNewEntity(t.customTypeId??undefined);setCreateSchemaRevision(currentSchemaRevision);}}}>Review current template</button>}</div>}{selectedTemplate&&<details className="template-preview"><summary>Template content and defaults</summary><p>{selectedTemplate.type} · {selectedTemplate.priority} priority · New Concept record</p>{selectedTemplate.tags.length>0&&<p>Tags: {selectedTemplate.tags.join(', ')}</p>}{Object.entries(selectedTemplate.customProperties??{}).map(([id,value])=><p key={id}>{projectSchema?.fields.find(f=>f.id===id)?.label??id}: {String(value)}</p>)}<pre>{selectedTemplate.body||'No initial body.'}</pre></details>}<label>Record title<input autoFocus disabled={create.isPending} required maxLength={160} value={newTitle} onChange={e=>setNewTitle(e.target.value)}/></label><label>Type<select aria-label="Type" disabled={!!creationType||create.isPending||!!selectedTemplate} value={newType} onChange={e=>{setNewType(e.target.value as Editable['type']);setNewEntity(undefined);setCreateSchemaRevision(undefined);}}>{types.map(t=><option key={t}>{t}</option>)}</select></label>{(availableEntities.length>0||newEntity)&&<label>Custom entity type<select aria-label="Custom entity type" disabled={create.isPending||!!selectedTemplate} value={newEntity??''} onChange={e=>{setNewEntity(e.target.value||undefined);setCreateSchemaRevision(currentSchemaRevision);}}><option value="">Built-in {newType}</option>{newEntity&&!availableEntities.some(e=>e.id===newEntity)&&<option value={newEntity} disabled>Unavailable: {newEntity}</option>}{availableEntities.map(e=><option key={e.id} value={e.id}>{e.label}</option>)}</select></label>}{createSchemaStale&&<div className="warning" role="alert">Entity schema changed. Review the current selection. {availableEntities.some(e=>e.id===newEntity)&&<button type="button" className="secondary" onClick={()=>setCreateSchemaRevision(currentSchemaRevision)}>Review current entity definition</button>}</div>}<button className="primary" disabled={create.isPending||createSchemaStale||templateStale}>Create</button><button className="secondary" type="button" disabled={create.isPending} onClick={()=>{setCreating(false);setNewTitle('');create.reset();}}>Cancel</button>{create.error&&<span role="alert">{create.error.message}</span>}</form>}
      {query.isPending&&<div className="empty">Opening your workspace…</div>}
      {query.error&&<div className="warning" role="alert"><AlertTriangle size={16}/> {query.error.message}</div>}
      {!!query.data?.errors.length&&<div className="warning" role="alert">{query.data.errors.map(e=><div key={e.file}>{e.file}: {e.message}</div>)}</div>}
      {!query.isPending&&!visible.length&&!['Overview','Audit','Repository','Changes','Wiki','Relationships','Trash','Schemas','Templates','Inbox','Search','Board','Plan','Timeline','Traceability','Recovery'].includes(view)&&<div className="empty"><LayoutGrid size={30}/><h2>No matching records</h2><p>Create a record or change your filters.</p></div>}
      {view==='Overview'&&!query.isPending&&<WorkspaceOverview project={project} records={records} findings={findings.length} incomplete={!!query.error||!!query.data?.errors.length} history={history} historyError={historyQuery.isError} onSelect={select} onNavigate={navigate} hrefFor={hrefFor}/>}
      {(view==='Wiki'||view==='Relationships')&&<Knowledge mode={view} visible={visible} records={records} onEdit={select} onDirectEdit={openEditor} onTrash={moveToTrash} disabled={controlsDisabled} focus={router.entry.context?.focus} hrefFor={hrefFor} onFocus={id=>router.replaceContext({...contextFor(navigation),slide:router.entry.context?.slide,focus:id})}/>}
      {view==='Recovery'&&<RecoveryWorkspace key={projectId} projectId={projectId} records={records} incomplete={query.isPending||!!query.error||!!query.data?.errors.length} onReview={openEditor}/>}
      {view==='Trash'&&<TrashView projectId={projectId}/>}
      {view==='Inbox'&&<Inbox projectId={projectId} records={records} incomplete={!!query.error||!!query.data?.errors.length} onOpen={select} hrefFor={hrefFor} onMerge={mergeRecords} onRefresh={()=>{void qc.invalidateQueries({queryKey:['records',projectId]});}} onBusyChange={setBusy}/>}
      {view==='Templates'&&<TemplateAdministration projectId={projectId} records={records} onBusyChange={setBusy}/>}
      {view==='Schemas'&&<SchemaAdministration projectId={projectId} records={records} incomplete={!!query.error||!!query.data?.errors.length} onBusyChange={setBusy}/>}
      {view==='Changes'&&<Changes history={history} loading={historyQuery.isFetching} error={historyQuery.isError} onRefresh={refreshHistory} records={records} onSelect={select} hrefFor={hrefFor}/>}
      {view==='Search'&&<ProjectSearch key={projectId} projectId={projectId} query={filters.search} repository={project.storage==='repository'} disabled={controlsDisabled} onSubmit={search=>changeFilters({...filters,search})} onOpen={select} hrefFor={hrefFor}/>}
      {view==='Repository'&&<Suspense fallback={<div className="empty" role="status">Loading repository view…</div>}><Repository projectId={projectId}/></Suspense>}
      {view==='Audit'&&project.storage==='repository'&&<><LocalVerification projectId={projectId} history={historyQuery.isError?undefined:history}/><BrowserVerification projectId={projectId} history={historyQuery.isError?undefined:history}/><HostedVerification projectId={projectId} repository={project.githubRepository} history={historyQuery.isError?undefined:history}/></>}
      {view==='Audit'&&<section className="audit-panel"><div className="audit-summary"><div><span className="eyebrow">RECORDS CHECKED</span><strong>{records.length}</strong></div><div><span className="eyebrow">REVIEW FINDINGS</span><strong>{findings.length}</strong></div></div><p className="audit-description">Deterministic checks of descriptions and record links. These findings are not a code quality or release readiness score.</p>{!findings.length&&!query.isPending&&!query.error&&<p>No record-level findings.</p>}{findings.map(f=><button key={f.id} className="audit-finding" onClick={()=>select(f.recordId)}><AlertTriangle size={17}/><span><strong>{f.title}</strong><small>{f.detail}</small></span><ArrowUpRight size={14}/></button>)}</section>}
      {!query.isPending&&view==='Traceability'&&<Traceability records={records} visible={visible} incomplete={!!query.error||!!query.data?.errors.length} onOpen={select} hrefFor={hrefFor}/>}
      {!query.isPending&&view==='Timeline'&&<Timeline records={visible} schema={projectSchema} config={navigation.timeline} disabled={controlsDisabled} incomplete={!!query.error||!!query.data?.errors.length} onChange={timeline=>router.replaceContext({...contextFor(navigation),timeline})} onOpen={select} hrefFor={hrefFor}/>}
      {!query.isPending&&view==='Plan'&&<DependencyPlan records={records} visible={visible} incomplete={!!query.error||!!query.data?.errors.length} onOpen={select} hrefFor={hrefFor}/>}
      {!query.isPending&&view==='Board'&&<StatusBoard key={selectionScope} records={visible} disabled={controlsDisabled} pending={propertyUpdate.isPending} onMove={(record,status)=>changeProperty(record,{status})} renderCard={r=><RecordCard record={r} typeLabel={entityTypeLabel(projectSchema,r.customTypeId,r.type)} selected={r.id===selected} href={hrefFor(r.id)} onSelect={()=>select(r.id)} onEdit={()=>openEditor(r.id)} onTrash={()=>moveToTrash(r.id)} disabled={controlsDisabled}/>}/>} 
      {!!visible.length&&view==='Gallery'&&<div className="gallery">{visible.map(r=><RecordCard key={r.id} record={r} typeLabel={entityTypeLabel(projectSchema,r.customTypeId,r.type)} selected={r.id===selected} href={hrefFor(r.id)} onSelect={()=>select(r.id)} onEdit={()=>openEditor(r.id)} onTrash={()=>moveToTrash(r.id)} disabled={controlsDisabled} gallery/>)}</div>}
      {view==='Table'&&selectedRecords.length>0&&<div className="bulk-toolbar"><strong>{selectedRecords.length} selected</strong><button className="secondary" disabled={controlsDisabled} onClick={()=>{setBulkResult(null);setBulkTargets(selectedRecords);}}>Edit selected</button><button className="secondary" disabled={controlsDisabled} onClick={()=>setSelection({scope:selectionScope,ids:[]})}>Clear selection</button><span>Selection is limited to 100 visible records.</span></div>}
      <div className="table-columns-slot">{view==='Table'&&currentView&&<TableColumns scope={router.entryKey+':'+router.entry.hash} ids={columnIds} schema={projectSchema} disabled={controlsDisabled} onChange={ids=>router.replaceContext({...contextFor(navigation),tableColumns:ids})} onReset={()=>router.replaceContext({...contextFor(navigation),tableColumns:undefined})}/>}</div>
      {!!visible.length&&view==='Table'&&<div className="table-wrap"><table className="records-table" style={{minWidth:tableMinWidth(columns)}}><colgroup><col className="record-col-selection"/><col className="record-col-title"/>{columns.map(c=><col key={c.id} style={{width:c.width}}/>)}<col className="record-col-actions"/></colgroup><thead><tr><th className="selection-cell"><input ref={selectAllRef} type="checkbox" aria-label="Select all visible records" title={visible.length>100?'Refine filters to select all (maximum 100)':'Select all visible records'} checked={allSelected} disabled={controlsDisabled||visible.length>100} onChange={e=>setSelection({scope:selectionScope,ids:e.target.checked?visible.map(r=>r.id):[]})}/></th><SortHeading field="Title" filters={filters} disabled={controlsDisabled} onSort={field=>changeFilters(sortBy(filters,field))}/>{columns.map(c=>c.sort?<SortHeading key={c.id} field={c.sort} filters={filters} disabled={controlsDisabled} onSort={field=>changeFilters(sortBy(filters,field))}/>:<th key={c.id}>{c.label}</th>)}<th>Actions</th></tr></thead><tbody>{visible.map(r=><tr key={r.id} className={'record-table-row'+(selected===r.id?' selected':'')} onClick={()=>select(r.id)}><td className="selection-cell" onClick={event=>event.stopPropagation()}><input type="checkbox" aria-label={'Select '+r.title} checked={selectedIds.has(r.id)} disabled={controlsDisabled||(!selectedIds.has(r.id)&&selectedRecords.length>=100)} onChange={()=>toggleSelected(r.id)}/></td><td><RouteLink className="record-table-title" href={hrefFor(r.id)} onNavigate={()=>select(r.id)}><span className={'dot '+r.accent}/>{r.title}</RouteLink></td>{columns.map(c=><td key={c.id} className={c.id==='delivery'?'configured-cell delivery-cell':'configured-cell'}>{c.id==='type'?entityTypeLabel(projectSchema,r.customTypeId,r.type):c.id==='status'||c.id==='priority'?<PropertyCell record={r} field={c.id} disabled={controlsDisabled} onChange={changes=>changeProperty(r,changes)}/>:c.id==='delivery'?(project.storage!=='repository'?'History unavailable':historyQuery.isError?'History unavailable':deliveryLabel(r,history)?.label||(history?.state==='available'?'No link found':historyQuery.isPending?'Loading…':'History unavailable')):c.id==='created'?r.createdAt??'—':c.id==='edited'?r.updatedAt??'—':c.id==='id'?r.id:c.id==='tags'?r.tags.join(', ')||'—':propertyColumnValue(r,c.id,projectSchema,recordsById)}</td>)}<td className="table-actions"><RecordActions record={r} onEdit={()=>openEditor(r.id)} onTrash={()=>moveToTrash(r.id)} disabled={controlsDisabled}/></td></tr>)}</tbody></table></div>}
      {view==='Slides'&&active&&<Suspense fallback={<div className="empty" role="status">Loading presentation…</div>}><SlideView active={active} slide={slide} count={visible.length} onPrevious={()=>setSlide(slide-1)} onNext={()=>setSlide(slide+1)} onEdit={()=>select(active.id)} onDirectEdit={()=>openEditor(active.id)} onTrash={()=>moveToTrash(active.id)} disabled={controlsDisabled}/></Suspense>}
      </>}
      </div><footer className="footer"><span>PRISM / DEVELOPMENT PREVIEW</span><span><Command size={12}/> Records are stored as Markdown</span></footer>
    </main>
  </div></RecordCommandContext.Provider>;
}

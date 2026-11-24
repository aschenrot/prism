import { z } from 'zod';
import { editableSchema,type Editable,type ProjectRecord } from './records';
export const editableFields=['title','type','status','priority','accent','tags','relationships','body','customProperties','customTypeId'] as const satisfies readonly (keyof Editable)[];
export type EditableField=typeof editableFields[number];
// Intermediate input may be invalid for saving (e.g. an empty title or unfinished tag).
const draftInput=editableSchema.extend({title:z.string().max(160),tags:z.array(z.string().max(4000)).max(4001)});
export const editorDraftSchema=z.strictObject({
  version:z.literal(1),
  baseRevision:z.string().regex(/^[a-f0-9]{64}$/),
  schemaRevision:z.string().regex(/^[a-f0-9]{64}$/).optional(),
  base:editableSchema,
  draft:draftInput,
  updatedAt:z.string().max(40).refine(v=>Number.isFinite(Date.parse(v)),'Invalid draft timestamp')
});
export type EditorDraft=z.infer<typeof editorDraftSchema>;
export function editableRecord(r:ProjectRecord):Editable{
  return {title:r.title,type:r.type,status:r.status,priority:r.priority,accent:r.accent,tags:r.tags,relationships:r.relationships,body:r.body,...(r.customProperties===undefined?{}:{customProperties:r.customProperties}),...(r.customTypeId===undefined?{}:{customTypeId:r.customTypeId})};
}
export function freshDraft(r:ProjectRecord):EditorDraft{
  const base=editableRecord(r);
  return {version:1,baseRevision:r.revision,base,draft:base,updatedAt:new Date().toISOString()};
}
function equal(a:unknown,b:unknown):boolean{return JSON.stringify(a)===JSON.stringify(b);}
export function isDirty(d:EditorDraft){return editableFields.some(key=>!equal(d.base[key],d.draft[key]));}
// Cancel rolls back this editing session, not a draft that existed before it began.
// Ignore timestamps; the original base matters if a conflict was resolved in this session.
export function changedSinceCheckpoint(session:EditorDraft,checkpoint:EditorDraft|null){
  return checkpoint?session.baseRevision!==checkpoint.baseRevision||editableFields.some(key=>!equal(session.base[key],checkpoint.base[key])||!equal(session.draft[key],checkpoint.draft[key])):isDirty(session);
}
export type ConflictChoice='local'|'disk';
export type ConflictChoices=Partial<Record<EditableField,ConflictChoice>>;
export function compareDraft(session:EditorDraft,current:ProjectRecord){
  const disk=editableRecord(current);
  const conflicts=editableFields.filter(key=>!equal(session.base[key],session.draft[key])&&!equal(session.base[key],disk[key])&&!equal(session.draft[key],disk[key]));
  return {disk,conflicts};
}
export function reconcileDraft(session:EditorDraft,current:ProjectRecord,choices:ConflictChoices):EditorDraft|null{
  const {disk,conflicts}=compareDraft(session,current);
  if(conflicts.some(key=>choices[key]!=='local'&&choices[key]!=='disk'))return null;
  const draft={...disk};
  function assign<K extends EditableField>(key:K){
    // Preserve disk-only edits and independently made identical changes.
    if(!equal(session.base[key],session.draft[key])&&(!conflicts.includes(key)||choices[key]==='local'))draft[key]=session.draft[key];
  }
  editableFields.forEach(assign);
  return {version:1,baseRevision:current.revision,base:disk,draft,...(session.schemaRevision?{schemaRevision:session.schemaRevision}:{}),updatedAt:new Date().toISOString()};
}

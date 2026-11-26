import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readdir, open, lstat, realpath, rename, unlink, writeFile, link, rmdir } from 'node:fs/promises';
import { join, resolve, dirname } from 'node:path';
import { parse, stringify } from 'yaml';
import { readProjectSchema,writeProjectSchema } from './projectSchema';
import type { TemplateStore } from './templates';
import { pullReferencesSchema,type PullReference } from '../shared/hostedVerification';
import { changedCustomKeys,customPropertyIssue,entityTypeIssue,type ProjectPropertySchema } from '../shared/customProperties';
import { idSchema, metadataSchema, recordSchema, editableSchema, propertyChangesSchema, type PropertyChanges, type Editable, type ProjectRecord, type RecordList, type TrashList } from '../shared/records';

export class ConflictError extends Error {}
export class MissingError extends Error {}
export class CustomPropertyError extends Error {}
export class RecordContentError extends Error {}
// Align with the existing scoped backup limit; no valid bytes are rewritten on rejection.
export const RECORD_FILE_LIMIT=16_000_000;
async function readRecordBytes(path:string){
  const initial=await lstat(path);
  if(!initial.isFile())throw new RecordContentError('Record must be a regular file');
  if(initial.size>RECORD_FILE_LIMIT)throw new RecordContentError('Record file exceeds the 16 MB limit');
  const handle=await open(path,'r');
  try{
    const stat=await handle.stat();
    if(!stat.isFile()||stat.dev!==initial.dev||stat.ino!==initial.ino||stat.size>RECORD_FILE_LIMIT)throw new RecordContentError('Record changed before it could be read. Refresh and retry.');
    // Read at most the observed size plus one byte, even if another process grows the file.
    const buffer=Buffer.allocUnsafe(stat.size+1);let offset=0;
    while(offset<buffer.length){const {bytesRead}=await handle.read(buffer,offset,buffer.length-offset,offset);if(!bytesRead)break;offset+=bytesRead;}
    const end=await handle.stat();
    if(offset!==stat.size||end.size!==stat.size||end.mtimeMs!==stat.mtimeMs||end.ctimeMs!==stat.ctimeMs)throw new RecordContentError('Record changed while it was being read. Refresh and retry.');
    return buffer.subarray(0,offset);
  }finally{await handle.close();}
}
export class RecordStore {
  private queue: Promise<unknown> = Promise.resolve();
  private constructor(private dir: string) {}
  static async open(root: string) {
    const dir = resolve(root, 'records');
    await mkdir(dir, { recursive: true });
    if ((await lstat(dir)).isSymbolicLink()) throw new Error('Records directory must not be a symlink');
    return new RecordStore(await realpath(dir));
  }
  private path(id: string) { return join(this.dir, idSchema.parse(id) + '.md'); }
  private serialize<T>(action: () => Promise<T>): Promise<T> {
    const task = this.queue.then(action, action);
    this.queue = task.then(() => undefined, () => undefined);
    return task;
  }
  schema(){return readProjectSchema(dirname(this.dir));}
  updateSchema(expectedRevision:string,definition:ProjectPropertySchema){return this.serialize(()=>writeProjectSchema(dirname(this.dir),expectedRevision,definition));}
  async get(id: string): Promise<ProjectRecord> {return this.readAt(id,this.path(id));}
  private async readAt(id:string,path:string):Promise<ProjectRecord>{
    let bytes:Buffer;
    try {
      bytes=await readRecordBytes(path);
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === 'ENOENT') throw new MissingError('Record not found');
      throw e;
    }
    let raw:string;
    try{raw=new TextDecoder('utf-8',{fatal:true,ignoreBOM:true}).decode(bytes);}catch{throw new RecordContentError('Record is not valid UTF-8. Repair its encoding outside Prism; original bytes are unchanged.');}
    const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)([\s\S]*)$/.exec(raw);
    if (!match) throw new Error('Missing YAML frontmatter');
    const metadata = metadataSchema.parse(parse(match[1], { maxAliasCount: 0 }));
    if (metadata.id !== id) throw new Error('Record ID does not match filename');
    const record = recordSchema.parse({ ...metadata, body: match[2] });
    return { ...record, revision: createHash('sha256').update(bytes).digest('hex') };
  }
  async list(): Promise<RecordList> {
    const records: ProjectRecord[] = [], errors: RecordList['errors'] = [];
    for (const file of (await readdir(this.dir)).sort()) {
      if (!file.endsWith('.md')) continue;
      try { records.push(await this.get(file.slice(0, -3))); }
      catch (e) { errors.push({file, message: e instanceof Error ? e.message : 'Invalid record'}); }
    }
    return { records, errors };
  }
  private async trashDirectory(create=false){
    const dir=join(dirname(this.dir),'trash');
    if(create)await mkdir(dir).catch(e=>{if((e as NodeJS.ErrnoException).code!=='EEXIST')throw e;});
    try{if(!(await lstat(dir)).isDirectory())throw new Error('Trash must be a real directory');}
    catch(e){if(!create&&(e as NodeJS.ErrnoException).code==='ENOENT')return null;throw e;}
    return dir;
  }
  private async trashEntry(id:string){
    const dir=await this.trashDirectory();
    if(!dir)throw new MissingError('Trash entry not found');
    const entry=join(dir,idSchema.parse(id));
    try{if(!(await lstat(entry)).isDirectory())throw new Error('Trash entry must be a real directory');}
    catch(e){if((e as NodeJS.ErrnoException).code==='ENOENT')throw new MissingError('Trash entry not found');throw e;}
    return {entry,path:join(entry,id+'.md')};
  }
  async listTrash():Promise<TrashList>{
    const records:ProjectRecord[]=[],errors:TrashList['errors']=[];
    const dir=await this.trashDirectory();
    if(!dir)return {records,errors};
    for(const id of (await readdir(dir)).sort()){
      try{const {path}=await this.trashEntry(id);records.push(await this.readAt(id,path));}
      catch(e){errors.push({file:id,message:e instanceof Error?e.message:'Invalid trash entry'});}
    }
    return {records,errors};
  }
  moveToTrash(id:string,revision:string){
    return this.serialize(async()=>{
      const current=await this.get(id);
      if(current.revision!==revision)throw new ConflictError('Record changed on disk. Reopen it before moving to trash.');
      const dir=await this.trashDirectory(true);
      if(!dir)throw new Error('Trash directory unavailable');
      const entry=join(dir,idSchema.parse(id)),target=join(entry,id+'.md');
      // Exclusive directory creation prevents overwriting an earlier trashed record.
      try{await mkdir(entry);}catch(e){if((e as NodeJS.ErrnoException).code==='EEXIST')throw new ConflictError('A trash entry already exists for this ID; resolve it before deleting.');throw e;}
      try{await rename(this.path(id),target);}
      catch(e){await rmdir(entry).catch(()=>undefined);throw e;}
      const moved=await this.readAt(id,target);
      // External processes cannot be locked by the server queue. Even if they raced the
      // move, the original bytes remain in trash; do not claim the expected revision moved.
      if(moved.revision!==revision)throw new ConflictError('The record changed during the move. Its bytes are preserved in Trash; inspect or restore it.');
      return moved;
    });
  }
  restoreTrash(id:string,revision:string){
    return this.serialize(async()=>{
      const {entry,path}=await this.trashEntry(id),record=await this.readAt(id,path);
      if(record.revision!==revision)throw new ConflictError('Trash entry changed. Refresh before restoring.');
      // Hard link creation is exclusive: an existing canonical file is never replaced.
      // If the filesystem lacks hard-link support, fail safely and retain trash.
      try{await link(path,this.path(id));}
      catch(e){if((e as NodeJS.ErrnoException).code==='EEXIST')throw new ConflictError('A record with this ID already exists. Restore would overwrite it.');throw e;}
      // If cleanup fails, both names remain; the data is still recoverable.
      try{await unlink(path);await rmdir(entry);}
      catch{throw new ConflictError('Record restored but trash cleanup did not complete. Inspect the record and Trash; no data was discarded.');}
      return this.get(id);
    });
  }
  private async persist(record: unknown,expectedRevision?:string) {
    const {body, ...metadata} = recordSchema.parse(record);
    delete metadata.revision;
    const path = this.path(String(metadata.id)), tmp = join(this.dir, '.' + randomUUID() + '.tmp');
    const raw='---\n'+stringify(metadata)+'---\n'+body;
    if(Buffer.byteLength(raw,'utf8')>RECORD_FILE_LIMIT)throw new RecordContentError('Record file exceeds the 16 MB limit. No changes were published.');
    const bytes=Buffer.from(raw,'utf8');
    if(bytes.toString('utf8')!==raw)throw new RecordContentError('Record contains invalid Unicode text. Correct the text before saving.');
    const intended=createHash('sha256').update(bytes).digest('hex');
    try {
      await writeFile(tmp,bytes,{flag:'wx',flush:true});
      if(expectedRevision===undefined){
        // New identity: publish exclusively, never replace an existing record.
        try{await link(tmp,path);}catch(e){if((e as NodeJS.ErrnoException).code==='EEXIST')throw new ConflictError('Record ID already exists. No existing record was overwritten.');throw e;}
      }else{
        // Recheck immediately before publication. Not a transaction against
        // non-cooperating external editors racing the final rename.
        if((await this.get(String(metadata.id))).revision!==expectedRevision)throw new ConflictError('Record changed before save. Review the current version and retry.');
        await rename(tmp,path);
      }
    } finally { await unlink(tmp).catch(() => undefined); }
    const saved=await this.get(String(metadata.id));
    if(saved.revision!==intended)throw new ConflictError('Save could not be confirmed. Refresh and review the file before retrying.');
    return saved;
  }
  create(title: string, type: Editable['type'],customTypeId?:string,expectedSchemaRevision?:string) {
    return this.serialize(async () => {
      if(customTypeId){const schema=await this.schema();if(schema.state!=='available'||schema.revision!==expectedSchemaRevision)throw new CustomPropertyError('Project schema changed or is unavailable. Review the current entity definition.');const issue=entityTypeIssue(schema.definition,type,customTypeId,true);if(issue)throw new CustomPropertyError(issue);}
      const now=new Date().toISOString();
      return this.persist({id:randomUUID(),title,type,status:'Concept',priority:'Normal',accent:'violet',tags:[],relationships:[],body:'',...(customTypeId?{customTypeId}:{}),createdAt:now,updatedAt:now});
    });
  }
  instantiateTemplate(templates:TemplateStore,templateId:string,expected:string,title:string,expectedSchemaRevision?:string){
    return this.serialize(async()=>{
      const template=await templates.get(templateId);
      if(template.revision!==expected||template.retired)throw new ConflictError('Template changed or is retired. Review the current definition before creating.');
      const id=randomUUID(),custom=template.customProperties??{};
      if(template.customTypeId||Object.keys(custom).length){
        const schema=await this.schema();if(schema.state!=='available'||schema.revision!==expectedSchemaRevision)throw new CustomPropertyError('Project schema changed or is unavailable. Review before creating from the template.');
        if(template.customTypeId){const issue=entityTypeIssue(schema.definition,template.type,template.customTypeId,true);if(issue)throw new CustomPropertyError(issue);}
        for(const [key,value] of Object.entries(custom)){
          const field=schema.definition.fields.find(f=>f.id===key);if(!field)throw new CustomPropertyError('Template property is unavailable: '+key);
          const target=field.kind==='reference'&&typeof value==='string'?await this.get(value).catch(()=>undefined):undefined;
          const issue=customPropertyIssue(field,template.type,value,id,target,template.customTypeId);if(issue)throw new CustomPropertyError(field.label+': '+issue);
        }
        const latest=await this.schema();if(latest.state!=='available'||latest.revision!==schema.revision)throw new CustomPropertyError('Project schema changed during validation. Review before creating.');
      }
      if((await templates.get(templateId)).revision!==expected)throw new ConflictError('Template changed during validation. Review before creating.');
      const now=new Date().toISOString();
      return this.persist({id,title,type:template.type,status:'Concept',priority:template.priority,accent:template.accent,tags:template.tags,relationships:[],body:template.body,...(template.customTypeId?{customTypeId:template.customTypeId}:{}),...(Object.keys(custom).length?{customProperties:custom}:{}),createdAt:now,updatedAt:now});
    });
  }
  capture(title:string,body:string){return this.serialize(()=>{const now=new Date().toISOString();return this.persist({id:randomUUID(),title,type:'Idea',status:'Concept',priority:'Normal',accent:'violet',tags:[],relationships:[],body,inbox:true,createdAt:now,updatedAt:now});});}
  setInbox(id:string,revision:string,inbox:boolean){return this.serialize(async()=>{const current=await this.get(id);if(current.revision!==revision)throw new ConflictError('Record changed on disk. Refresh before triage.');if(!!current.inbox===inbox)return current;const {revision:_,...previous}=current;return this.persist({...previous,inbox,updatedAt:new Date().toISOString()},revision);});}
  // Duplicate only saved, editable content. A copy is new work, never inherited acceptance.
  duplicate(id:string,revision:string){
    return this.serialize(async()=>{
      const source=await this.get(id);
      if(source.revision!==revision)throw new ConflictError('Record changed on disk. Refresh before duplicating.');
      if(source.customTypeId){const schema=await this.schema();if(schema.state!=='available'||entityTypeIssue(schema.definition,source.type,source.customTypeId,true))throw new CustomPropertyError('The custom entity type is unavailable or retired. Reactivate or clear it before duplicating.');}
      const now=new Date().toISOString(),suffix=' (copy)';
      const title=source.title.slice(0,160-suffix.length).replace(/[\uD800-\uDBFF]$/,'').trimEnd()+suffix;
      return this.persist({id:randomUUID(),title,type:source.type,status:'Concept',priority:source.priority,accent:source.accent,tags:source.tags.filter(t=>!['acceptance','current','blocker'].includes(t.toLowerCase())),relationships:[],body:source.body,...(source.customTypeId?{customTypeId:source.customTypeId}:{}),createdAt:now,updatedAt:now});
    });
  }
  updatePullReferences(id:string,revision:string,references:PullReference[]){return this.serialize(async()=>{
    const current=await this.get(id);if(current.revision!==revision)throw new ConflictError('Record changed on disk. Review before saving pull request references.');
    if(current.type!=='Increment')throw new ConflictError('Pull request associations can only be authored for delivery increments.');
    const next=pullReferencesSchema.parse(references);if(JSON.stringify(current.githubPullRequests??[])===JSON.stringify(next))return current;
    const {revision:_,...previous}=current;return this.persist({...previous,githubPullRequests:next,updatedAt:new Date().toISOString()},revision);
  });}
  updateProperties(id:string,revision:string,changes:PropertyChanges){
    return this.serialize(async()=>{
      const current=await this.get(id);
      if(current.revision!==revision)throw new ConflictError('Record changed on disk. Refresh before editing its properties.');
      const next=propertyChangesSchema.parse(changes);
      if(Object.entries(next).every(([key,value])=>value===undefined||current[key]===value))return current;
      const {revision:_,...previous}=current;
      return this.persist({...previous,...Object.fromEntries(Object.entries(next).filter(([,value])=>value!==undefined)),updatedAt:new Date().toISOString()},revision);
    });
  }
  update(id: string, revision: string, changes: Editable, expectedSchemaRevision?:string) {
    return this.serialize(async () => {
      const current = await this.get(id);
      if (current.revision !== revision) throw new ConflictError('Record changed on disk. Reload before saving.');
      const {revision: _, ...previous} = current;
      const next=editableSchema.parse(changes);
      // Omitted fields preserve stored values for older clients and drafts.
      const finalEntity=next.customTypeId===undefined?current.customTypeId:next.customTypeId;
      const entityChanged=(finalEntity??null)!==(current.customTypeId??null);
      const entityRoleChanged=!!finalEntity&&next.type!==current.type;
      const keys=next.customProperties===undefined?[]:changedCustomKeys(current.customProperties,next.customProperties);
      if(entityChanged||entityRoleChanged||keys.length){
        const schema=await this.schema();
        if(schema.state!=='available'||schema.revision!==expectedSchemaRevision)throw new CustomPropertyError('Project schema changed or is unavailable. Review the current schema before saving custom properties or entity type.');
        if(entityChanged||entityRoleChanged){
          const issue=entityTypeIssue(schema.definition,next.type,finalEntity,entityChanged);
          if(issue)throw new CustomPropertyError(issue);
        }
        for(const key of keys){
          const field=schema.definition.fields.find(f=>f.id===key),value=next.customProperties?.[key];
          if(!field)throw new CustomPropertyError('Unconfigured property cannot be changed: '+key);
          if(field.appliesToEntities&&entityTypeIssue(schema.definition,next.type,finalEntity,false))throw new CustomPropertyError('Review the custom entity type before editing scoped properties.');
          const target=field.kind==='reference'&&typeof value==='string'?await this.get(value).catch(()=>undefined):undefined;
          const issue=customPropertyIssue(field,next.type,value,id,target,finalEntity);
          if(issue)throw new CustomPropertyError(field.label+': '+issue);
        }
        const latest=await this.schema();
        if(latest.state!=='available'||latest.revision!==schema.revision)throw new CustomPropertyError('Project schema changed during validation. Review before saving.');
        if((await this.get(id)).revision!==revision)throw new ConflictError('Record changed during schema validation. Review before saving.');
      }
      if(next.customProperties===undefined)delete next.customProperties;
      if(next.customTypeId===undefined)delete next.customTypeId;
      if(Object.entries(next).every(([key,value])=>JSON.stringify(current[key])===JSON.stringify(value)))return current;
      return this.persist({...previous,...next,id,updatedAt:new Date().toISOString()},revision);
    });
  }
}

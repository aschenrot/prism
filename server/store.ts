import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readdir, readFile, lstat, realpath, rename, unlink, writeFile, link, rmdir } from 'node:fs/promises';
import { join, resolve, dirname } from 'node:path';
import { parse, stringify } from 'yaml';
import { idSchema, metadataSchema, recordSchema, editableSchema, propertyChangesSchema, type PropertyChanges, type Editable, type ProjectRecord, type RecordList, type TrashList } from '../shared/records';

export class ConflictError extends Error {}
export class MissingError extends Error {}
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
  async get(id: string): Promise<ProjectRecord> {return this.readAt(id,this.path(id));}
  private async readAt(id:string,path:string):Promise<ProjectRecord>{
    let raw: string;
    try {
      if (!(await lstat(path)).isFile()) throw new Error('Record must be a regular file');
      raw = await readFile(path, 'utf8');
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === 'ENOENT') throw new MissingError('Record not found');
      throw e;
    }
    const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)([\s\S]*)$/.exec(raw);
    if (!match) throw new Error('Missing YAML frontmatter');
    const metadata = metadataSchema.parse(parse(match[1], { maxAliasCount: 0 }));
    if (metadata.id !== id) throw new Error('Record ID does not match filename');
    const record = recordSchema.parse({ ...metadata, body: match[2] });
    return { ...record, revision: createHash('sha256').update(raw).digest('hex') };
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
  private async persist(record: unknown) {
    const {body, ...metadata} = recordSchema.parse(record);
    delete metadata.revision;
    const path = this.path(String(metadata.id)), tmp = join(this.dir, '.' + randomUUID() + '.tmp');
    try {
      await writeFile(tmp, '---\n' + stringify(metadata) + '---\n' + body, { flag:'wx', flush:true });
      await rename(tmp, path);
    } finally { await unlink(tmp).catch(() => undefined); }
    return this.get(String(metadata.id));
  }
  create(title: string, type: Editable['type']) {
    return this.serialize(async () => {
      const now=new Date().toISOString();
      return this.persist({id:randomUUID(),title,type,status:'Concept',priority:'Normal',accent:'violet',tags:[],relationships:[],body:'',createdAt:now,updatedAt:now});
    });
  }
  // Duplicate only saved, editable content. A copy is new work, never inherited acceptance.
  duplicate(id:string,revision:string){
    return this.serialize(async()=>{
      const source=await this.get(id);
      if(source.revision!==revision)throw new ConflictError('Record changed on disk. Refresh before duplicating.');
      const now=new Date().toISOString(),suffix=' (copy)';
      const title=source.title.slice(0,160-suffix.length).replace(/[\uD800-\uDBFF]$/,'').trimEnd()+suffix;
      return this.persist({id:randomUUID(),title,type:source.type,status:'Concept',priority:source.priority,accent:source.accent,tags:source.tags.filter(t=>!['acceptance','current','blocker'].includes(t.toLowerCase())),relationships:[],body:source.body,createdAt:now,updatedAt:now});
    });
  }
  updateProperties(id:string,revision:string,changes:PropertyChanges){
    return this.serialize(async()=>{
      const current=await this.get(id);
      if(current.revision!==revision)throw new ConflictError('Record changed on disk. Refresh before editing its properties.');
      const next=propertyChangesSchema.parse(changes);
      if(Object.entries(next).every(([key,value])=>value===undefined||current[key]===value))return current;
      const {revision:_,...previous}=current;
      return this.persist({...previous,...Object.fromEntries(Object.entries(next).filter(([,value])=>value!==undefined)),updatedAt:new Date().toISOString()});
    });
  }
  update(id: string, revision: string, changes: Editable) {
    return this.serialize(async () => {
      const current = await this.get(id);
      if (current.revision !== revision) throw new ConflictError('Record changed on disk. Reload before saving.');
      const {revision: _, ...previous} = current;
      const next=editableSchema.parse(changes);
      if(Object.entries(next).every(([key,value])=>JSON.stringify(current[key])===JSON.stringify(value)))return current;
      return this.persist({...previous,...next,id,updatedAt:new Date().toISOString()});
    });
  }
}

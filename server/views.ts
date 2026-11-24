import { createHash, randomUUID } from 'node:crypto';
import { lstat,mkdir,readFile,readdir,realpath,writeFile,unlink,rename } from 'node:fs/promises';
import { join } from 'node:path';
import { parse,stringify } from 'yaml';
import { idSchema } from '../shared/records';
import { viewSchema,viewInputSchema,type ViewInput,type SavedView,type ViewList } from '../shared/views';
import { ConflictError,MissingError } from './store';
export class ViewStore {
  private queue:Promise<unknown>=Promise.resolve();
  private constructor(private dir:string){}
  static async open(root:string){
    const dir=join(root,'views');await mkdir(dir,{recursive:true});
    if(!(await lstat(dir)).isDirectory())throw new Error('Views directory must be a real directory');
    return new ViewStore(await realpath(dir));
  }
  private path(id:string){return join(this.dir,idSchema.parse(id)+'.yaml');}
  private serialize<T>(fn:()=>Promise<T>):Promise<T>{
    const next=this.queue.then(fn,fn);this.queue=next.then(()=>undefined,()=>undefined);return next;
  }
  async get(id:string):Promise<SavedView>{
    const path=this.path(id);let raw:Buffer;
    try{
      const stat=await lstat(path);
      if(!stat.isFile()||stat.size>64000)throw new Error('Invalid view file');
      raw=await readFile(path);
    }catch(e){if((e as NodeJS.ErrnoException).code==='ENOENT')throw new MissingError('View not found');throw e;}
    const view=viewSchema.parse(parse(raw.toString('utf8'),{maxAliasCount:0}));
    if(view.id!==id)throw new Error('View ID does not match filename');
    return {...view,revision:createHash('sha256').update(raw).digest('hex')};
  }
  async list():Promise<ViewList>{
    const views:SavedView[]=[],errors:ViewList['errors']=[];
    for(const file of (await readdir(this.dir)).sort()){
      if(!file.endsWith('.yaml'))continue;
      try{views.push(await this.get(file.slice(0,-5)));}catch(e){errors.push({file,message:e instanceof Error?e.message:'Invalid view'});}
    }
    return {views:views.sort((a,b)=>a.title.localeCompare(b.title)||a.id.localeCompare(b.id)),errors};
  }
  private async persist(id:string,input:ViewInput){
    const value=viewSchema.parse({...viewInputSchema.parse(input),id,version:1});
    const tmp=join(this.dir,'.'+randomUUID()+'.tmp');
    try{await writeFile(tmp,stringify(value),{flag:'wx',flush:true});await rename(tmp,this.path(id));}
    finally{await unlink(tmp).catch(()=>undefined);}
    return this.get(id);
  }
  create(input:ViewInput){return this.serialize(()=>this.persist(randomUUID(),input));}
  update(id:string,expected:string,input:ViewInput){return this.serialize(async()=>{
    if((await this.get(id)).revision!==expected)throw new ConflictError('Saved view changed on disk. Reopen it before updating.');
    return this.persist(id,input);
  });}
  remove(id:string,expected:string){return this.serialize(async()=>{
    if((await this.get(id)).revision!==expected)throw new ConflictError('Saved view changed on disk. Reopen it before deleting.');
    await unlink(this.path(id));return {ok:true};
  });}
}

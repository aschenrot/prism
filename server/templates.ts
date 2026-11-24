import { createHash,randomUUID } from 'node:crypto';
import { lstat,mkdir,readFile,readdir,realpath,writeFile,unlink,rename,link } from 'node:fs/promises';
import { join } from 'node:path';
import { parse,stringify } from 'yaml';
import { idSchema } from '../shared/records';
import { templateSchema,templateInputSchema,type TemplateInput,type RecordTemplate,type TemplateList } from '../shared/templates';
import { ConflictError,MissingError } from './store';
export class TemplateStore{
 private queue:Promise<unknown>=Promise.resolve();
 private constructor(private root:string){}
 static async open(root:string){const dir=join(root,'templates');await mkdir(dir,{recursive:true});if(!(await lstat(dir)).isDirectory())throw new Error('Templates directory must be a real directory');return new TemplateStore(await realpath(dir));}
 private path(id:string){return join(this.root,idSchema.parse(id)+'.yaml');}
 private serialize<T>(fn:()=>Promise<T>){const next=this.queue.then(fn,fn);this.queue=next.then(()=>undefined,()=>undefined);return next;}
 async get(id:string):Promise<RecordTemplate>{
  const path=this.path(id);let raw:Buffer;
  try{const stat=await lstat(path);if(!stat.isFile()||stat.size>256000)throw Error('Invalid template file');raw=await readFile(path);if(raw.length>256000)throw Error('Invalid template file');}catch(e){if((e as NodeJS.ErrnoException).code==='ENOENT')throw new MissingError('Template not found');throw e;}
  const value=templateSchema.parse(parse(raw.toString('utf8'),{maxAliasCount:0}));if(value.id!==id)throw Error('Template ID does not match filename');
  return {...value,revision:createHash('sha256').update(raw).digest('hex')};
 }
 async list():Promise<TemplateList>{
  const templates:RecordTemplate[]=[],errors:TemplateList['errors']=[];for(const file of (await readdir(this.root)).sort()){if(!file.endsWith('.yaml'))continue;try{templates.push(await this.get(file.slice(0,-5)));}catch(e){errors.push({file,message:e instanceof Error?e.message:'Invalid template'});}}
  return {templates:templates.sort((a,b)=>a.name.localeCompare(b.name)||a.id.localeCompare(b.id)),errors};
 }
 private async persist(id:string,input:TemplateInput,expected?:string){
  const value=templateSchema.parse({...templateInputSchema.parse(input),id,version:1}),raw=stringify(value);
  if(Buffer.byteLength(raw)>256000)throw Error('Template exceeds file size limit');
  const tmp=join(this.root,'.'+randomUUID()+'.tmp');
  try{await writeFile(tmp,raw,{flag:'wx',flush:true});
   if(expected===undefined){try{await link(tmp,this.path(id));}catch(e){if((e as NodeJS.ErrnoException).code==='EEXIST')throw new ConflictError('Template ID already exists');throw e;}}
   else{if((await this.get(id)).revision!==expected)throw new ConflictError('Template changed on disk. Review before saving.');await rename(tmp,this.path(id));}
  }finally{await unlink(tmp).catch(()=>undefined);}
  return this.get(id);
 }
 create(input:TemplateInput){return this.serialize(()=>this.persist(randomUUID(),input));}
 update(id:string,expected:string,input:TemplateInput){return this.serialize(()=>this.persist(id,input,expected));}
}

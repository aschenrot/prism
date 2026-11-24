import { createHash } from 'node:crypto';
import { lstat, mkdir, readFile, readdir, realpath, writeFile, unlink } from 'node:fs/promises';
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { z } from 'zod';

const ID='[a-z0-9][a-z0-9-]{0,95}';
const allowed=new RegExp('^(?:schema\\.yaml|records/'+ID+'\\.md|(?:views|templates)/'+ID+'\\.yaml|trash/('+ID+')/\\1\\.md|acceptance\\.local/'+ID+'\\.'+ID+'\\.json)$');
const limit=16_000_000,totalLimit=256_000_000,countLimit=20_000;
const marker='.prism-restore-incomplete';
const manifestName='prism-backup.json';
const hash=(data:Buffer)=>createHash('sha256').update(data).digest('hex');
const entrySchema=z.object({path:z.string().regex(allowed),bytes:z.number().int().min(0).max(limit),sha256:z.string().regex(/^[a-f0-9]{64}$/)}).strict();
const manifestSchema=z.object({version:z.literal(1),createdAt:z.string().datetime(),files:z.array(entrySchema).max(countLimit)}).strict().superRefine((m,c)=>{
 if(new Set(m.files.map(f=>f.path)).size!==m.files.length)c.addIssue({code:'custom',message:'Duplicate backup path'});
 if(m.files.reduce((n,f)=>n+f.bytes,0)>totalLimit)c.addIssue({code:'custom',message:'Backup exceeds size limit'});
});
type Manifest=z.infer<typeof manifestSchema>;
async function directory(path:string){if(!(await lstat(path)).isDirectory())throw new Error('Expected real directory: '+path);}
async function exists(path:string){try{await lstat(path);return true;}catch(e){if((e as NodeJS.ErrnoException).code==='ENOENT')return false;throw e;}}
async function bytes(path:string,max=limit){const stat=await lstat(path);if(!stat.isFile()||stat.size>max)throw new Error('Invalid or oversized file: '+path);const data=await readFile(path);if(data.length>max)throw new Error('File exceeds limit: '+path);return data;}
function contained(root:string,path:string){const rel=relative(root,path);return rel===''||(!isAbsolute(rel)&&rel!=='..'&&!rel.startsWith('..'+sep));}
async function destination(source:string,path:string){
 const target=join(await realpath(dirname(resolve(path))),basename(resolve(path)));
 if(contained(source,target)||contained(target,source))throw new Error('Source and destination must not overlap');
 if(await exists(target))throw new Error('Destination already exists');
 return target;
}
async function scan(root:string){
 await directory(root);
 if(await exists(join(root,marker)))throw new Error('Incomplete restore cannot be backed up');
 const result:string[]=[];
 async function walk(prefix:string,depth:number){
  const path=join(root,prefix);await directory(path);
  for(const name of await readdir(path)){
   const item=prefix+'/'+name;
   if(depth>0){await walk(item,depth-1);continue;}
   if(!allowed.test(item))throw new Error('Unexpected project data entry: '+item);
   result.push(item);if(result.length>countLimit)throw new Error('Too many project files');
  }
 }
 for(const name of ['records','views','templates','acceptance.local','trash']){
  if(await exists(join(root,name)))await walk(name,name==='trash'?1:0);
 }
 if(await exists(join(root,'schema.yaml')))result.push('schema.yaml');
 return result.sort();
}
async function collect(root:string,paths:string[]){
 const entries:Manifest['files']=[];let total=0;
 for(const path of paths){
  // Recheck all directories before each read; symlinked store entries are never accepted.
  const parts=path.split('/');let current=root;
  for(const part of parts.slice(0,-1)){current=join(current,part);await directory(current);}
  const data=await bytes(join(root,path));total+=data.length;if(total>totalLimit)throw new Error('Backup exceeds size limit');
  entries.push({path,bytes:data.length,sha256:hash(data)});
 }
 return entries;
}
async function writeNew(root:string,path:string,data:Buffer|string){
 const target=join(root,path);await mkdir(dirname(target),{recursive:true,mode:0o700});
 await writeFile(target,data,{flag:'wx',mode:0o600});
}
async function copyChecked(source:string,target:string,entry:Manifest['files'][number]){
 const parts=entry.path.split('/');let current=source;
 for(const part of parts.slice(0,-1)){current=join(current,part);await directory(current);}
 const data=await bytes(join(source,entry.path));
 if(data.length!==entry.bytes||hash(data)!==entry.sha256)throw new Error('File changed or failed integrity check: '+entry.path);
 await writeNew(target,entry.path,data);
}
export async function createProjectBackup(sourcePath:string,destinationPath:string){
 const source=await realpath(sourcePath);await directory(source);
 const target=await destination(source,destinationPath);
 const paths=await scan(source),files=await collect(source,paths);
 await mkdir(target,{mode:0o700});
 // A backup is usable only once its final manifest exists. Never overwrite a backup.
 for(const file of files)await copyChecked(source,target,file);
 if(JSON.stringify(await collect(source,await scan(source)))!==JSON.stringify(files))throw new Error('Project changed during backup; stop editors and retry in a new directory');
 const manifest=manifestSchema.parse({version:1,createdAt:new Date().toISOString(),files});
 await writeNew(target,manifestName,JSON.stringify(manifest,null,2)+'\n');
 return manifest;
}
export async function verifyProjectBackup(path:string){
 const root=await realpath(path);await directory(root);
 const manifest=manifestSchema.parse(JSON.parse((await bytes(join(root,manifestName))).toString('utf8')));
 const actual=await collect(root,await scan(root));
 const expected=[...manifest.files].sort((a,b)=>a.path<b.path?-1:a.path>b.path?1:0);
 if(JSON.stringify(actual)!==JSON.stringify(expected))throw new Error('Backup integrity check failed: missing, unexpected, or modified file');
 return manifest;
}
export async function restoreProjectBackup(sourcePath:string,destinationPath:string){
 const source=await realpath(sourcePath),target=await destination(source,destinationPath);
 const manifest=await verifyProjectBackup(source);
 await mkdir(target,{mode:0o700});await writeNew(target,marker,'Incomplete restore. Do not open.\n');
 for(const file of manifest.files)await copyChecked(source,target,file);
 // Keep the incomplete marker until all files have been copied and checked.
 for(const entry of manifest.files){const data=await bytes(join(target,entry.path));if(data.length!==entry.bytes||hash(data)!==entry.sha256)throw new Error('Restored file failed integrity check');}
 await unlink(join(target,marker));return manifest;
}
export async function rejectIncompleteRestore(root:string){
 if(await exists(join(root,marker)))throw new Error('Incomplete project restore; restore again into a new directory');
}

import { createHash,randomUUID } from 'node:crypto';
import { lstat,mkdir,readFile,realpath,writeFile,rename,link,unlink } from 'node:fs/promises';
import { join,resolve,relative,isAbsolute,sep } from 'node:path';
import { parse,stringify } from 'yaml';
import { registrySchema,projectSchema,type ProjectConfig } from '../shared/projects';
import { rejectIncompleteRestore } from './projectBackup';

const candidates=['.prism/projects.local.yaml','.prism/projects.yaml','examples/bevy.projects.yaml'];
const local=candidates[0],LIMIT=256_000;
type Selection={path:string|null;revision:string|null;configs:ProjectConfig[];fallback:boolean};
function absent(error:unknown){return (error as NodeJS.ErrnoException).code==='ENOENT';}
const digest=(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex');
async function readRegistry(path:string,requireRealFile:boolean){
 const stat=requireRealFile?await lstat(path):undefined;
 if(stat&&(!stat.isFile()||stat.size>LIMIT))throw Error('Registry must be a real, bounded file');
 const bytes=await readFile(path);if(bytes.length>LIMIT)throw Error('Registry exceeds size limit');
 return {revision:digest(bytes),configs:registrySchema.parse(parse(bytes.toString('utf8'),{maxAliasCount:0}))};
}
// One precedence implementation for normal startup and local registration.
// Explicit environment overrides remain read-only to the registration command.
export async function selectRegistry(cwd:string,env:NodeJS.ProcessEnv,strictLocal=false):Promise<Selection>{
 if(env.PRISM_PROJECTS){const path=resolve(cwd,env.PRISM_PROJECTS);return {path,...await readRegistry(path,false),fallback:false};}
 if(!env.PRISM_PROJECT)for(const name of candidates){
  const path=resolve(cwd,name);
  try{return {path,...await readRegistry(path,strictLocal),fallback:false};}catch(e){if(!absent(e))throw e;}
 }
 return {path:null,revision:null,fallback:true,configs:[{id:'local',title:env.PRISM_PROJECT?'Local project':'Demo game project',root:resolve(cwd,env.PRISM_PROJECT||'workspace'),storage:'standalone',profiles:['core','game']}]};
}
async function realDirectory(path:string){const root=await realpath(path);if(!(await lstat(root)).isDirectory())throw Error('Project root must be a directory');return root;}
function contains(parent:string,child:string){const rel=relative(parent,child);return rel===''||(!isAbsolute(rel)&&rel!=='..'&&!rel.startsWith('..'+sep));}
// Validate existing folder grants without creating stores or opening repository code.
// Distinct project roots may be nested (the bundled examples), but data stores may not.
export async function validateRegistration(configs:ProjectConfig[],cwd:string){
 const roots=new Set<string>(),dataRoots:string[]=[];
 for(const config of registrySchema.parse(configs)){
  const root=await realDirectory(resolve(cwd,config.root));
  if(roots.has(root))throw Error('Project roots must be distinct');roots.add(root);
  const data=config.storage==='repository'?join(root,'.prism'):root;
  try{if(!(await lstat(data)).isDirectory())throw Error('Project data directory must be a real directory');await rejectIncompleteRestore(data);}catch(e){if(!absent(e)||config.storage!=='repository')throw e;}
  if(dataRoots.some(existing=>contains(existing,data)||contains(data,existing)))throw Error('Project data directories must not overlap');
  dataRoots.push(data);
 }
}
export type RegistryChange={action:'add';config:ProjectConfig}|{action:'settings';id:string;title:string;profiles:ProjectConfig['profiles'];githubRepository?:string};
export async function changeLocalRegistry(cwd:string,env:NodeJS.ProcessEnv,change:RegistryChange){
 if(env.PRISM_PROJECTS||env.PRISM_PROJECT)throw Error('Explicit project override active. Unset it before changing the default local registry.');
 const dir=join(cwd,'.prism');await mkdir(dir,{recursive:true});
 if(!(await lstat(dir)).isDirectory())throw Error('Local registry directory must be a real directory');
 const lock=join(dir,'projects.local.yaml.lock'),temp=join(dir,'.registry-'+randomUUID()+'.tmp');
 await writeFile(lock,'Local registry command in progress\n',{flag:'wx',mode:0o600});
 try{
  const before=await selectRegistry(cwd,{},true);
  let configs=before.configs.map(p=>({...p}));
  if(change.action==='add'){
   const config=projectSchema.parse(change.config);if(configs.some(p=>p.id===config.id))throw Error('Project ID already registered');
   const root=await realDirectory(resolve(cwd,config.root));configs.push({...config,root});
  }else{
   const current=configs.find(p=>p.id===change.id);if(!current)throw Error('Unknown project ID');
   configs=configs.map(p=>p.id===change.id?projectSchema.parse({...p,title:change.title,profiles:change.profiles,githubRepository:change.githubRepository}):p);
  }
  // A fallback folder is not silently created by the registration command. Start
  // the default workspace once if it does not yet exist.
  await validateRegistration(configs,cwd);
  const raw=stringify(registrySchema.parse(configs));if(Buffer.byteLength(raw)>LIMIT)throw Error('Registry exceeds size limit');
  await writeFile(temp,raw,{flag:'wx',mode:0o600,flush:true});
  const observed=await selectRegistry(cwd,{},true);
  if(before.path!==observed.path||before.revision!==observed.revision)throw Error('Registry changed during command. Review and retry.');
  const target=join(cwd,local);
  // First local publication is exclusive. Subsequent replacement uses the
  // exact observed revision and a cooperative lock; stop Prism before changes.
  if(before.path===target)await rename(temp,target);else await link(temp,target);
  return registrySchema.parse(configs);
 }finally{await unlink(temp).catch(()=>{});await unlink(lock);}
}

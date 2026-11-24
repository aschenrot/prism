import { lstat, mkdir, readFile, realpath } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { parse } from 'yaml';
import { registrySchema, type ProjectConfig, type ProjectInfo } from '../shared/projects';
import { ConflictError,MissingError, RecordStore } from './store';
import { ViewStore } from './views';
import { TemplateStore } from './templates';
import { AcceptanceStore } from './acceptance';
import { rejectIncompleteRestore } from './projectBackup';
import { gitHistory } from './git';
import { readVerification } from './verification';
export type OpenProject = { info:ProjectInfo; root:string; store:RecordStore; views:ViewStore; templates:TemplateStore; acceptance:AcceptanceStore };
export class Projects {
  private constructor(private projects:Map<string,OpenProject>) {}
  static async open(configs:ProjectConfig[]) {
    const result = new Map<string,OpenProject>();
    const roots = new Set<string>();
    for(const config of registrySchema.parse(configs)){
      const root = await realpath(resolve(config.root));
      if(!(await lstat(root)).isDirectory())throw new Error('Project root must be a directory');
      if(roots.has(root))throw new Error('Project roots must be distinct');
      roots.add(root);
      const data = config.storage==='repository'?join(root,'.prism'):root;
      if(config.storage==='repository'){
        await mkdir(data,{recursive:true});
        if(!(await lstat(data)).isDirectory())throw new Error('Project data directory must be a real directory');
      }
      const {root:_,...info}=config;
      await rejectIncompleteRestore(data);
      const store=await RecordStore.open(data);
      const acceptance=new AcceptanceStore(data,async id=>{
        if(info.storage!=='repository')throw new ConflictError('Revision-bound acceptance requires a connected Git repository');
        const record=await store.get(id),history=await gitHistory(root);
        if(history.state!=='available')throw new ConflictError('Could not establish an independent Git revision for this project');
        const verification=await readVerification(root);
        return {record,head:history.head,verification:verification.state==='available'?verification.report:null};
      });
      result.set(info.id,{info,root,store,views:await ViewStore.open(data),templates:await TemplateStore.open(data),acceptance});
    }
    return new Projects(result);
  }
  list(){return [...this.projects.values()].map(p=>p.info);}
  get(id:string){const project=this.projects.get(id);if(!project)throw new MissingError('Unknown project');return project;}
}
// Registry paths and relative project roots are resolved against the launch directory.
// Explicit overrides take precedence. A malformed configured registry is an error,
// never a reason to silently switch to demo data.
export async function loadProjects(cwd=process.cwd(),env:NodeJS.ProcessEnv=process.env){
  const fromRegistry=async(raw:string)=>Projects.open(registrySchema.parse(parse(raw,{maxAliasCount:0})).map(config=>({...config,root:resolve(cwd,config.root)})));
  if(env.PRISM_PROJECTS){
    return fromRegistry(await readFile(resolve(cwd,env.PRISM_PROJECTS),'utf8'));
  }
  if(!env.PRISM_PROJECT){
    for(const candidate of ['.prism/projects.local.yaml','.prism/projects.yaml','examples/bevy.projects.yaml']){
      let raw:string;
      try{raw=await readFile(resolve(cwd,candidate),'utf8');}
      catch(e){if((e as NodeJS.ErrnoException).code==='ENOENT')continue;throw e;}
      return fromRegistry(raw);
    }
  }
  const root=resolve(cwd,env.PRISM_PROJECT||'workspace');
  await mkdir(root,{recursive:true});
  return Projects.open([{id:'local',title:env.PRISM_PROJECT?'Local project':'Demo game project',root,storage:'standalone',profiles:['core','game']}]);
}

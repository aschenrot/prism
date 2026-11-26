import { lstat, mkdir, readFile, realpath } from 'node:fs/promises';
import { resolve, join,relative } from 'node:path';
import { selectRegistry,validateRegistration,changeLocalRegistry,managedWorkspaceDirectory,RegistryChanged } from './localRegistry';
import { registrySchema,createWorkspaceSchema,workspaceProfile,type CreateWorkspaceInput,type WorkspaceCreationAvailability,type ProjectConfig, type ProjectInfo } from '../shared/projects';
import { ConflictError,MissingError, RecordStore } from './store';
import { ViewStore } from './views';
import { TemplateStore } from './templates';
import { AcceptanceStore } from './acceptance';
import { rejectIncompleteRestore } from './projectBackup';
import { gitHistory } from './git';
import { readVerification } from './verification';
export type OpenProject = { info:ProjectInfo; root:string; store:RecordStore; views:ViewStore; templates:TemplateStore; acceptance:AcceptanceStore };
export class Projects {
  private context:{cwd:string;env:NodeJS.ProcessEnv}|undefined;
  private creating=false;
  private constructor(private projects:Map<string,OpenProject>) {}
  static async open(configs:ProjectConfig[]) {
    // Preflight the complete registry before creating any project store, regardless
    // of whether it came from the CLI, a portable file or an explicit override.
    await validateRegistration(configs,process.cwd());
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
  enableLocalCreation(cwd:string,env:NodeJS.ProcessEnv){this.context={cwd,env};return this;}
  creationAvailability():WorkspaceCreationAvailability{
    if(!this.context||this.context.env.PRISM_PROJECTS||this.context.env.PRISM_PROJECT)return {available:false,reason:'Workspace creation is unavailable while an explicit project configuration is active.'};
    if(this.projects.size>=40)return {available:false,reason:'The project limit has been reached.'};
    return {available:true};
  }
  async createWorkspace(raw:CreateWorkspaceInput):Promise<ProjectInfo>{
    const input=createWorkspaceSchema.parse(raw),id='workspace-'+input.requestId;
    if(!this.context||this.context.env.PRISM_PROJECTS||this.context.env.PRISM_PROJECT)throw new ConflictError('Workspace creation is unavailable while an explicit project configuration is active.');
    const existing=this.projects.get(id);
    if(existing){
      const expected=join(await realpath(this.context.cwd),managedWorkspaceDirectory,id);
      if(relative(expected,existing.root)===''&&existing.info.storage==='standalone'&&existing.info.title===input.title&&JSON.stringify(existing.info.profiles)===JSON.stringify(workspaceProfile(input.profile)))return existing.info;
      throw new ConflictError('This creation request already belongs to another workspace. Start a new request.');
    }
    if(this.creating)throw new ConflictError('Another workspace is being created. Try again.');
    this.creating=true;
    try{
      const expected=[...this.projects.values()].map(p=>({...p.info,root:p.root}));
      const prepared:OpenProject[]=[];
      await changeLocalRegistry(this.context.cwd,this.context.env,{action:'create-managed',input,expected,prepare:async config=>{
        prepared.push((await Projects.open([config])).get(config.id));
      }});
      const opened=prepared[0];
      if(!opened)throw new Error('Workspace initialization missing');
      this.projects.set(opened.info.id,opened);
      return opened.info;
    }catch(e){
      if(e instanceof RegistryChanged)throw new ConflictError(e.message);
      throw e;
    }finally{this.creating=false;}
  }
  list(){return [...this.projects.values()].map(p=>p.info);}
  get(id:string){const project=this.projects.get(id);if(!project)throw new MissingError('Unknown project');return project;}
}
// Registry paths and relative project roots are resolved against the launch directory.
// Explicit overrides take precedence. A malformed configured registry is an error,
// never a reason to silently switch to demo data.
export async function loadProjects(cwd=process.cwd(),env:NodeJS.ProcessEnv=process.env){
 const selection=await selectRegistry(cwd,env);
 if(selection.fallback)await mkdir(selection.configs[0].root,{recursive:true});
 return (await Projects.open(selection.configs.map(config=>({...config,root:resolve(cwd,config.root)})))).enableLocalCreation(cwd,env);
}

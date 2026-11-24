import { lstat, mkdir, readFile, realpath } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { parse } from 'yaml';
import { registrySchema, type ProjectConfig, type ProjectInfo } from '../shared/projects';
import { MissingError, RecordStore } from './store';
export type OpenProject = { info:ProjectInfo; root:string; store:RecordStore };
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
      result.set(info.id,{info,root,store:await RecordStore.open(data)});
    }
    return new Projects(result);
  }
  list(){return [...this.projects.values()].map(p=>p.info);}
  get(id:string){const project=this.projects.get(id);if(!project)throw new MissingError('Unknown project');return project;}
}
export async function loadProjects(){
  if(process.env.PRISM_PROJECTS){
    const path=resolve(process.env.PRISM_PROJECTS);
    return Projects.open(registrySchema.parse(parse(await readFile(path,'utf8'),{maxAliasCount:0})));
  }
  const root=resolve(process.env.PRISM_PROJECT||'workspace');
  await mkdir(root,{recursive:true});
  return Projects.open([{id:'local',title:process.env.PRISM_PROJECT?'Local project':'Demo game project',root,storage:'standalone',profiles:['core','game']}]);
}

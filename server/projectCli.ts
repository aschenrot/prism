import { projectSchema,type ProjectConfig } from '../shared/projects';
import { changeLocalRegistry,selectRegistry } from './localRegistry';
const [command,...args]=process.argv.slice(2);
const usage='npm run project -- list | add <id> <title> <existing-folder> <standalone|repository> <profiles-comma-separated> [owner/repo] | settings <id> <title> <profiles-comma-separated> [owner/repo|-]';
const profiles=(raw:string)=>raw.split(',').filter(Boolean) as ProjectConfig['profiles'];
try{
 let configs:ProjectConfig[];
 if(command==='list'&&!args.length){const selected=await selectRegistry(process.cwd(),process.env);configs=selected.configs;console.log('Registry: '+(selected.path??'standalone fallback'));}
 else if(command==='add'&&(args.length===5||args.length===6)){
  const [id,title,root,storage,profileList,githubRepository]=args;
  configs=await changeLocalRegistry(process.cwd(),process.env,{action:'add',config:projectSchema.parse({id,title,root,storage,profiles:profiles(profileList),githubRepository})});console.log('Registered locally. Restart Prism to open the project.');
 }else if(command==='settings'&&(args.length===3||args.length===4)){
  const [id,title,profileList,githubRepository]=args;
  configs=await changeLocalRegistry(process.cwd(),process.env,{action:'settings',id,title,profiles:profiles(profileList),githubRepository:githubRepository==='-'?undefined:githubRepository});console.log('Local settings saved. Restart Prism to apply.');
 }else throw Error(usage);
 for(const p of configs)console.log(p.id+' | '+p.title+' | '+p.storage+' | '+p.profiles.join(',')+(p.githubRepository?' | '+p.githubRepository:''));
}catch(e){console.error(e instanceof Error?e.message:String(e));process.exitCode=1;}

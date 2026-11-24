import { lstat, readdir, readFile, realpath } from 'node:fs/promises';
import { join, relative, resolve, sep, isAbsolute } from 'node:path';
import type { RepositoryFile, RepositoryIndex } from '../shared/projects';
import { MissingError } from './store';
const MAX_FILES=1500, MAX_BYTES=512_000, MAX_DEPTH=12;
const ignored=new Set(['.git','.prism','node_modules','target','dist','build','vendor']);
function classify(path:string):RepositoryFile['kind']|undefined {
  if(/(?:^|\/)(?:Cargo\.toml|Cargo\.lock|package\.json|pyproject\.toml)$/i.test(path))return 'manifest';
  if(/\.(md|mdx|rst|adoc|txt)$/i.test(path))return 'documentation';
  if(/\.(rs|ts|tsx|js|jsx|py|wgsl|glsl|ron)$/i.test(path))return 'source';
}
function within(root:string,path:string){const rel=relative(root,path);return rel!==''&&!isAbsolute(rel)&&rel!=='..'&&!rel.startsWith('..'+sep);}
export async function indexRepository(root:string):Promise<RepositoryIndex>{
  const files:RepositoryFile[]=[];let truncated=false;let visited=0;
  async function walk(dir:string,depth:number){
    if(depth>MAX_DEPTH){truncated=true;return;}
    const entries=await readdir(dir,{withFileTypes:true});
    for(const entry of entries.sort((a,b)=>a.name.localeCompare(b.name))){
      if(files.length>=MAX_FILES||visited++>=12000){truncated=true;return;}
      if(entry.name.startsWith('.')||ignored.has(entry.name)||entry.isSymbolicLink())continue;
      const full=join(dir,entry.name);
      if(entry.isDirectory()){await walk(full,depth+1);continue;}
      if(!entry.isFile())continue;
      const path=relative(root,full).split(sep).join('/');
      const kind=classify(path);if(!kind)continue;
      const stat=await lstat(full);if(stat.isFile())files.push({path,kind,size:stat.size});
    }
  }
  // Root docs/manifests and conventional source/documentation folders only.
  const entries=await readdir(root,{withFileTypes:true});
  for(const entry of entries.sort((a,b)=>a.name.localeCompare(b.name))){
    if(entry.name.startsWith('.')||entry.isSymbolicLink())continue;
    const full=join(root,entry.name);
    if(entry.isDirectory()&&['src','docs','crates','examples','tests','benches'].includes(entry.name))await walk(full,1);
    else if(entry.isFile()){
      const kind=classify(entry.name);if(kind){const stat=await lstat(full);if(stat.isFile())files.push({path:entry.name,kind,size:stat.size});}
    }
    if(files.length>=MAX_FILES){truncated=true;break;}
  }
  return {files:files.sort((a,b)=>a.path.localeCompare(b.path)).slice(0,MAX_FILES),truncated};
}
export async function readRepositoryFile(root:string,path:string){
  // Match the same allowlist as indexing. Never execute repository content.
  const parts=path.split('/');
  if(parts.some(p=>!p||p.startsWith('.')||ignored.has(p)||p.includes('\\')||p.includes(':'))||parts.length>MAX_DEPTH+2||
    (parts.length>1&&!['src','docs','crates','examples','tests','benches'].includes(parts[0]))||!classify(path))throw new MissingError('File not available');
  const full=resolve(root,...parts);
  if(!within(root,full))throw new MissingError('File not available');
  let current=root;
  for(const part of parts){current=join(current,part);if((await lstat(current)).isSymbolicLink())throw new MissingError('File not available');}
  const actual=await realpath(full);
  if(!within(root,actual))throw new MissingError('File not available');
  const stat=await lstat(actual);
  if(!stat.isFile()||stat.size>MAX_BYTES)throw new MissingError('File is not available for preview (512 KB limit)');
  return {path,content:await readFile(actual,'utf8')};
}

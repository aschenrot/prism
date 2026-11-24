import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,rm,lstat,symlink} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {stringify} from 'yaml';
import {changeLocalRegistry,selectRegistry} from '../server/localRegistry';
import {loadProjects} from '../server/projects';
import type {ProjectConfig} from '../shared/projects';
const config=(id:string,root:string,storage:ProjectConfig['storage']='standalone'):ProjectConfig=>({id,title:id,root,storage,profiles:['core']});
async function fixture(fn:(cwd:string)=>Promise<void>){
 const cwd=await mkdtemp(join(tmpdir(),'prism-registration-'));try{
  for(const d of ['.prism','first','second','third'])await mkdir(join(cwd,d));
  await writeFile(join(cwd,'.prism/projects.yaml'),stringify([config('first','first')]));await fn(cwd);
 }finally{await rm(cwd,{recursive:true,force:true});}
}
test('registration preserves portable registry, opens independent projects and keeps stable IDs on settings changes',()=>fixture(async cwd=>{
 const portable=join(cwd,'.prism/projects.yaml'),original=await readFile(portable);
 await changeLocalRegistry(cwd,{}, {action:'add',config:config('second','second','repository')});
 assert.deepEqual(await readFile(portable),original);await assert.rejects(lstat(join(cwd,'second','.prism')));
 const opened=await loadProjects(cwd,{});assert.deepEqual(opened.list().map(p=>p.id),['first','second']);
 assert.ok(opened.list().every(p=>!('root' in p)));const record=await opened.get('second').store.create('Second only','Task');
 await changeLocalRegistry(cwd,{}, {action:'settings',id:'second',title:'Renamed',profiles:['core','product'],githubRepository:'example/project'});
 const reopened=await loadProjects(cwd,{});assert.equal(reopened.get('second').info.title,'Renamed');assert.equal((await reopened.get('second').store.get(record.id)).title,'Second only');assert.equal((await reopened.get('first').store.list()).records.length,0);
 assert.equal((await selectRegistry(cwd,{PRISM_PROJECT:'third'})).configs[0].id,'local');
}));
test('registration rejects overrides, duplicate identities, aliased roots and overlapping data stores without rewriting registry',()=>fixture(async cwd=>{
 const original=await readFile(join(cwd,'.prism/projects.yaml'));
 const add=(p:ProjectConfig)=>changeLocalRegistry(cwd,{}, {action:'add',config:p});
 await assert.rejects(changeLocalRegistry(cwd,{PRISM_PROJECT:'first'}, {action:'add',config:config('new','second')}),/override/);
 await assert.rejects(add(config('first','second')),/already registered/);
 await symlink(join(cwd,'first'),join(cwd,'alias'),'junction');await assert.rejects(add(config('alias','alias')),/distinct/);
 await mkdir(join(cwd,'first','nested'));await assert.rejects(add(config('nested','first/nested')),/overlap/);
 await assert.rejects(add(config('missing','missing')));
 await assert.rejects(lstat(join(cwd,'.prism/projects.local.yaml')));assert.deepEqual(await readFile(join(cwd,'.prism/projects.yaml')),original);
}));
test('local registry rejects corrupt or symlinked registries and competing command lock',()=>fixture(async cwd=>{
 const local=join(cwd,'.prism/projects.local.yaml'),lock=local+'.lock';
 await writeFile(lock,'other command');await assert.rejects(changeLocalRegistry(cwd,{}, {action:'add',config:config('second','second')}));await rm(lock);
 await writeFile(local,'broken');await assert.rejects(changeLocalRegistry(cwd,{}, {action:'add',config:config('second','second')}));assert.equal(await readFile(local,'utf8'),'broken');
 await rm(local);await symlink(join(cwd,'first'),local,'junction');await assert.rejects(changeLocalRegistry(cwd,{}, {action:'add',config:config('second','second')}));
}));

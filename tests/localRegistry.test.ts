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

test('startup preflights every configured data root before opening stores, including manual overrides',()=>fixture(async cwd=>{
 const outer=join(cwd,'first'),nested=join(outer,'nested');await mkdir(nested);
 await writeFile(join(cwd,'override.yaml'),stringify([config('one','first'),config('nested','first/nested')]));
 await assert.rejects(loadProjects(cwd,{PRISM_PROJECTS:'override.yaml'}),/overlap/);await assert.rejects(lstat(join(outer,'records')));await assert.rejects(lstat(join(nested,'records')));
 await mkdir(join(cwd,'second','.prism'));await writeFile(join(cwd,'override.yaml'),stringify([config('repo','second','repository'),config('same-data','second/.prism')]));
 await assert.rejects(loadProjects(cwd,{PRISM_PROJECTS:'override.yaml'}),/overlap/);await assert.rejects(lstat(join(cwd,'second','.prism','records')));
}));

test('managed workspace is initialized before registry publication, persists on restart and retries are idempotent',()=>fixture(async cwd=>{
 const projects=await loadProjects(cwd,{}),original=await readFile(join(cwd,'.prism/projects.yaml'));
 const input={title:'New project',profile:'game' as const,requestId:'12345678-1234-4234-8234-123456789abc'};
 const created=await projects.createWorkspace(input);assert.equal(created.title,'New project');assert.equal(created.storage,'standalone');assert.ok(!('root' in created));
 assert.deepEqual(await projects.createWorkspace(input),created);assert.equal(projects.list().length,2);
 const record=await projects.get(created.id).store.create('Only in new workspace','Task');
 assert.equal((await projects.get('first').store.list()).records.length,0);
 const reopened=await loadProjects(cwd,{});assert.deepEqual(reopened.list(),projects.list());assert.equal((await reopened.get(created.id).store.get(record.id)).title,record.title);
 assert.deepEqual(await readFile(join(cwd,'.prism/projects.yaml')),original);
 await assert.rejects(projects.createWorkspace({...input,title:'Different name'}),/already belongs/);
}));
test('managed creation rejects override, external registry change, invalid input and linked storage without altering existing project',()=>fixture(async cwd=>{
 const input={title:'New project',profile:'general' as const,requestId:'12345678-1234-4234-8234-123456789abc'};
 const override=await loadProjects(cwd,{PRISM_PROJECT:'first'});assert.equal(override.creationAvailability().available,false);await assert.rejects(override.createWorkspace(input),/explicit project configuration/);
 const projects=await loadProjects(cwd,{});const original=await readFile(join(cwd,'.prism/projects.yaml'));
 await assert.rejects(projects.createWorkspace({...input,requestId:'../outside'}));
 await symlink(join(cwd,'second'),join(cwd,'.prism-workspaces.local'),'junction');
 await assert.rejects(projects.createWorkspace(input),/real directory/);assert.deepEqual(await readFile(join(cwd,'.prism/projects.yaml')),original);await rm(join(cwd,'.prism-workspaces.local'));
 await changeLocalRegistry(cwd,{}, {action:'add',config:config('second','second')});
 await assert.rejects(projects.createWorkspace(input),/configuration changed/);assert.equal(projects.list().length,1);
 await assert.rejects(lstat(join(cwd,'.prism-workspaces.local')));
}));
test('managed workspace initialization failure does not publish registry or overwrite a reserved directory',()=>fixture(async cwd=>{
 const input={title:'New project',profile:'general' as const,requestId:'12345678-1234-4234-8234-123456789abc'};
 const original=await readFile(join(cwd,'.prism/projects.yaml'));
 const expected=(await selectRegistry(cwd,{})).configs;
 await assert.rejects(changeLocalRegistry(cwd,{}, {action:'create-managed',input,expected,prepare:async()=>{throw Error('fixture initialization failure');}}),/fixture initialization failure/);
 await assert.rejects(lstat(join(cwd,'.prism/projects.local.yaml')));assert.deepEqual(await readFile(join(cwd,'.prism/projects.yaml')),original);
 await assert.rejects(changeLocalRegistry(cwd,{}, {action:'create-managed',input,expected,prepare:async()=>{throw Error('must not initialize again');}}),/unregistered workspace folder/);
}));

test('live project settings preserve root, other profiles and records; reject stale revisions and persist on restart',()=>fixture(async cwd=>{
 await changeLocalRegistry(cwd,{}, {action:'add',config:{...config('second','second','repository'),profiles:['core','rust','project','game'],githubRepository:'owner/repo'}});
 const projects=await loadProjects(cwd,{}),target=projects.get('second'),record=await target.store.create('Retained record','Task');
 const initial=projects.settings('second');assert.equal(initial.editable,true);assert.ok(!('root' in initial.project));
 const input={expectedRevision:initial.revision,title:'Renamed',product:true,game:false,githubRepository:'owner/repo'};
 const saved=await projects.updateSettings('second',input);assert.equal(saved.project.title,'Renamed');assert.deepEqual(saved.project.profiles,['core','rust','project','product']);assert.equal(saved.project.githubRepository,'owner/repo');assert.notEqual(saved.revision,initial.revision);
 assert.equal(projects.get('second'),target);assert.equal((await target.store.get(record.id)).revision,record.revision);
 await assert.rejects(projects.updateSettings('second',input),/settings changed/);
 const reopened=await loadProjects(cwd,{});assert.deepEqual(reopened.settings('second'),saved);assert.equal((await reopened.get('second').store.get(record.id)).title,record.title);
 const clear=await projects.updateSettings('second',{...input,expectedRevision:saved.revision,githubRepository:null});assert.equal(clear.project.githubRepository,undefined);
}));
test('live settings reject external registry edits, override mode, root mutation and standalone GitHub association',()=>fixture(async cwd=>{
 const projects=await loadProjects(cwd,{}),initial=projects.settings('first'),input={expectedRevision:initial.revision,title:'Rename',product:true,game:false,githubRepository:null};
 await assert.rejects(projects.updateSettings('first',{...input,root:'second'} as typeof input),/Unrecognized/);
 await assert.rejects(projects.updateSettings('first',{...input,githubRepository:'owner/repo'}),/connected repository/);
 const override=await loadProjects(cwd,{PRISM_PROJECT:'first'});assert.equal(override.settings('local').editable,false);await assert.rejects(override.updateSettings('local',{...input,expectedRevision:override.settings('local').revision}),/read-only/);
 await changeLocalRegistry(cwd,{}, {action:'add',config:config('second','second')});
 await assert.rejects(projects.updateSettings('first',input),/configuration changed/);assert.equal(projects.settings('first').project.title,initial.project.title);
}));

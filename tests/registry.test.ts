import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp,mkdir,writeFile,rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { stringify } from 'yaml';
import { loadProjects } from '../server/projects';

test('project registry discovery respects explicit overrides and local configuration',async()=>{
  const root=await mkdtemp(join(tmpdir(),'prism-registry-'));
  try{
    for(const dir of ['examples','.prism','game','workspace','custom'])await mkdir(join(root,dir));
    const config=(id:string,folder:string)=>({id,title:id,root:folder,storage:'standalone',profiles:['core']});
    await writeFile(join(root,'examples','bevy.projects.yaml'),stringify([config('emberfall','game'),config('demo','workspace')]));
    assert.deepEqual((await loadProjects(root,{})).list().map(p=>p.id),['emberfall','demo']);
    await writeFile(join(root,'.prism','projects.yaml'),stringify([{id:'prism',title:'Prism Development',root:'.',storage:'repository',profiles:['core','product','project']},config('emberfall','game'),config('demo','workspace')]));
    const self=await loadProjects(root,{});
    assert.deepEqual(self.list().map(p=>p.id),['prism','emberfall','demo']);
    const ownRecord=await self.get('prism').store.create('Prism-only task','Task');
    assert.equal((await self.get('emberfall').store.list()).records.length,0);
    assert.equal((await self.get('prism').store.list()).records[0].id,ownRecord.id);
    await writeFile(join(root,'.prism','projects.local.yaml'),stringify([config('custom','custom')]));
    assert.deepEqual((await loadProjects(root,{})).list().map(p=>p.id),['custom']);
    assert.deepEqual((await loadProjects(root,{PRISM_PROJECT:'game'})).list().map(p=>p.id),['local']);
    assert.deepEqual((await loadProjects(root,{PRISM_PROJECT:'custom',PRISM_PROJECTS:'examples/bevy.projects.yaml'})).list().map(p=>p.id),['emberfall','demo']);
    await writeFile(join(root,'.prism','projects.local.yaml'),'not a registry');
    await assert.rejects(loadProjects(root,{}));
    await assert.rejects(loadProjects(root,{PRISM_PROJECTS:'missing.yaml'}));
  }finally{await rm(root,{recursive:true,force:true});}
});
test('standalone fallback works without registry files',async()=>{
  const root=await mkdtemp(join(tmpdir(),'prism-standalone-'));
  try{assert.deepEqual((await loadProjects(root,{})).list().map(p=>p.id),['local']);}
  finally{await rm(root,{recursive:true,force:true});}
});

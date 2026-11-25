import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,readFile,writeFile,readdir,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {stringify} from 'yaml';
import {loadProjects} from '../server/projects';

test('actual backup and registration CLI commands restore authored data into a distinct local project',async()=>{
 const cwd=await mkdtemp(join(tmpdir(),'prism-cli-workflows-'));
 const env=Object.fromEntries(Object.entries(process.env).filter(([k])=>!['PRISM_PROJECT','PRISM_PROJECTS'].includes(k.toUpperCase())));
 const run=(script:'projectCli'|'backupCli',...args:string[])=>execFileSync(process.execPath,['--import',import.meta.resolve('tsx'),fileURLToPath(new URL('../server/'+script+'.ts',import.meta.url)),...args],{cwd,env,encoding:'utf8',timeout:20000,windowsHide:true});
 try{
  const source=join(cwd,'source'),backup=join(cwd,'backup'),restored=join(cwd,'restored');
  await mkdir(source);await mkdir(join(cwd,'.prism'));
  const portable=join(cwd,'.prism','projects.yaml');
  await writeFile(portable,stringify([{id:'source',title:'Source fixture',root:'source',storage:'standalone',profiles:['core','product']}]));
  const before=await readFile(portable);
  const opened=await loadProjects(cwd,env);const record=await opened.get('source').store.create('CLI round trip fixture','Task');
  const files=await readdir(join(source,'records'));assert.equal(files.length,1);const bytes=await readFile(join(source,'records',files[0]));
  assert.match(run('projectCli','list'),/source \| Source fixture/);
  assert.match(run('backupCli','create',source,backup),/create complete:/);
  assert.match(run('backupCli','verify',backup),/verify complete:/);
  assert.match(run('backupCli','restore',backup,restored),/restore complete:/);
  assert.deepEqual(await readFile(join(restored,'records',files[0])),bytes);
  assert.match(run('projectCli','add','restored','Restored fixture',restored,'standalone','core,product'),/Registered locally/);
  assert.match(run('projectCli','settings','restored','Renamed restored fixture','core,product,project'),/Local settings saved/);
  assert.deepEqual(await readFile(portable),before);
  const result=await loadProjects(cwd,env);assert.deepEqual(result.list().map(p=>p.id),['source','restored']);
  assert.equal(result.get('restored').info.title,'Renamed restored fixture');assert.equal((await result.get('restored').store.get(record.id)).title,record.title);
  await result.get('restored').store.create('Restored-only task','Task');
  assert.equal((await result.get('source').store.list()).records.length,1);
  assert.equal((await result.get('restored').store.list()).records.length,2);
  assert.deepEqual(await readFile(join(source,'records',files[0])),bytes);
 }finally{await rm(cwd,{recursive:true,force:true});}
});

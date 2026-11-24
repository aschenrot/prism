import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp,mkdir,writeFile,readFile,rm,lstat,symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createProjectBackup,verifyProjectBackup,restoreProjectBackup,rejectIncompleteRestore } from '../server/projectBackup';
async function fixture(fn:(root:string,source:string)=>Promise<void>){
 const root=await mkdtemp(join(tmpdir(),'prism-backup-'));
 try{const source=join(root,'source');await mkdir(source);for(const dir of ['records','views','templates','trash/deleted','acceptance.local','cache'])await mkdir(join(source,dir),{recursive:true});
 for(const path of ['records/alpha.md','views/main.yaml','templates/basic.yaml','trash/deleted/deleted.md','acceptance.local/test.run.json','schema.yaml','cache/private.json','projects.local.yaml'])await writeFile(join(source,path),'original '+path+'\r\n');
 await fn(root,source);}finally{await rm(root,{recursive:true,force:true});}
}
test('backup restores exact project data bytes and excludes local registry and caches',()=>fixture(async(root,source)=>{
 const backup=join(root,'backup'),restored=join(root,'restored');
 const manifest=await createProjectBackup(source,backup);assert.equal(manifest.files.length,6);assert.deepEqual(await verifyProjectBackup(backup),manifest);
 await restoreProjectBackup(backup,restored);
 for(const file of manifest.files)assert.deepEqual(await readFile(join(restored,file.path)),await readFile(join(source,file.path)));
 await assert.rejects(lstat(join(restored,'cache')));await assert.rejects(lstat(join(restored,'projects.local.yaml')));
 await assert.rejects(restoreProjectBackup(backup,restored),/already exists/);await assert.rejects(createProjectBackup(source,join(source,'backup')),/overlap/);
}));
test('backup rejects corrupt and malicious manifests before creating restore directory',()=>fixture(async(root,source)=>{
 const backup=join(root,'backup'),restored=join(root,'restored');
 await createProjectBackup(source,backup);await writeFile(join(backup,'records/alpha.md'),'changed');await assert.rejects(verifyProjectBackup(backup),/integrity/);
 await assert.rejects(restoreProjectBackup(backup,restored));await assert.rejects(lstat(restored));
 const manifest=JSON.parse(await readFile(join(backup,'prism-backup.json'),'utf8'));manifest.files[0].path='../escape';await writeFile(join(backup,'prism-backup.json'),JSON.stringify(manifest));await assert.rejects(verifyProjectBackup(backup));await assert.rejects(lstat(restored));
}));
test('backup refuses incomplete restore and unexpected project store entries',()=>fixture(async(root,source)=>{
 await writeFile(join(source,'.prism-restore-incomplete'),'incomplete');await assert.rejects(rejectIncompleteRestore(source),/Incomplete/);await assert.rejects(createProjectBackup(source,join(root,'backup')),/Incomplete/);
 await rm(join(source,'.prism-restore-incomplete'));await writeFile(join(source,'records/unknown.txt'),'data');await assert.rejects(createProjectBackup(source,join(root,'backup')),/Unexpected/);
}));
test('backup does not traverse linked project directories',()=>fixture(async(root,source)=>{
 await rm(join(source,'views'),{recursive:true});const external=join(root,'external');await mkdir(external);await writeFile(join(external,'secret.yaml'),'secret');await symlink(external,join(source,'views'),'junction');await assert.rejects(createProjectBackup(source,join(root,'backup')),/real directory/);
}));

test('backup rejects a mistaken source or backup-as-project and restores a genuinely empty project',()=>fixture(async(root,source)=>{
 const wrong=join(root,'wrong'),empty=join(root,'empty'),backup=join(root,'empty-backup'),restored=join(root,'empty-restored');await mkdir(wrong);await mkdir(join(empty,'records'),{recursive:true});
 await assert.rejects(createProjectBackup(wrong,join(root,'wrong-backup')),/Not a Prism data root/);await assert.rejects(lstat(join(root,'wrong-backup')));
 const result=await createProjectBackup(empty,backup);assert.equal(result.files.length,0);await verifyProjectBackup(backup);await assert.rejects(rejectIncompleteRestore(backup),/not a writable project/);await assert.rejects(createProjectBackup(backup,join(root,'backup-copy')),/not a writable project/);
 await restoreProjectBackup(backup,restored);assert.ok((await lstat(join(restored,'records'))).isDirectory());await rejectIncompleteRestore(restored);
}));

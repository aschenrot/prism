import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Projects } from '../server/projects';
import { indexRepository,readRepositoryFile } from '../server/repository';
import { auditRecords } from '../shared/audit';
test('separate projects isolate records and repository storage',async()=>{
  const base=await mkdtemp(join(tmpdir(),'prism-projects-'));
  try{
    const a=join(base,'a'),b=join(base,'b');await mkdir(a);await mkdir(b);
    const projects=await Projects.open([{id:'a',title:'A',root:a,storage:'standalone',profiles:['core']},{id:'b',title:'B',root:b,storage:'repository',profiles:['core','rust']}]);
    const r=await projects.get('b').store.create('Combat','Feature');
    assert.equal((await projects.get('a').store.list()).records.length,0);
    assert.equal((await projects.get('b').store.list()).records[0].id,r.id);
    assert.match(await readRepositoryFile(b,'README.md').catch(e=>String(e)),/ENOENT/);
    assert.equal(auditRecords([r])[0].title,'Missing description');
    assert.throws(()=>projects.get('unknown'));
  }finally{await rm(base,{recursive:true,force:true});}
});
test('repository scans allowed paths, rejects traversal and symlinks',async()=>{
  const root=await mkdtemp(join(tmpdir(),'prism-repository-'));
  try{
    await mkdir(join(root,'src'));await mkdir(join(root,'target'));
    await writeFile(join(root,'src','main.rs'),'fn main() {}');
    await writeFile(join(root,'README.md'),'# Demo');
    await writeFile(join(root,'target','hidden.rs'),'hidden');
    await symlink(join(root,'README.md'),join(root,'src','link.md'));
    const index=await indexRepository(root);
    assert.deepEqual(index.files.map(f=>f.path),['README.md','src/main.rs']);
    assert.equal((await readRepositoryFile(root,'src/main.rs')).content,'fn main() {}');
    await assert.rejects(readRepositoryFile(root,'../README.md'));
    await assert.rejects(readRepositoryFile(root,'src/link.md'));
    await assert.rejects(readRepositoryFile(root,'target/hidden.rs'));
  }finally{await rm(root,{recursive:true,force:true});}
});

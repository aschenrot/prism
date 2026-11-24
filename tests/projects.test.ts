import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Projects } from '../server/projects';
import { MissingError } from '../server/store';
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
    await assert.rejects(readRepositoryFile(b,'README.md'),MissingError);
    assert.equal(auditRecords([r])[0].title,'Missing description');
    assert.throws(()=>projects.get('unknown'));
  }finally{await rm(base,{recursive:true,force:true});}
});

test('repository scans allowed paths and rejects traversal',async()=>{
  const root=await mkdtemp(join(tmpdir(),'prism-repository-'));
  try{
    await mkdir(join(root,'src'));await mkdir(join(root,'target'));
    await writeFile(join(root,'src','main.rs'),'fn main() {}');
    await writeFile(join(root,'README.md'),'# Demo');
    await writeFile(join(root,'target','hidden.rs'),'hidden');
    const index=await indexRepository(root);
    assert.deepEqual(index.files.map(f=>f.path),['README.md','src/main.rs']);
    assert.equal((await readRepositoryFile(root,'src/main.rs')).content,'fn main() {}');
    await assert.rejects(readRepositoryFile(root,'../README.md'),MissingError);
    await assert.rejects(readRepositoryFile(root,'target/hidden.rs'),MissingError);
    await assert.rejects(readRepositoryFile(root,'src/not-found.rs'),MissingError);
  }finally{await rm(root,{recursive:true,force:true});}
});

test('repository excludes directory links and Windows junctions',async()=>{
  const base=await mkdtemp(join(tmpdir(),'prism-junction-'));
  try{
    const root=join(base,'project'), outside=join(base,'outside');
    await mkdir(join(root,'src'),{recursive:true});await mkdir(outside);
    await writeFile(join(outside,'private.rs'),'outside project');
    await symlink(outside,join(root,'src','linked'),process.platform==='win32'?'junction':'dir');
    assert.deepEqual((await indexRepository(root)).files,[]);
    await assert.rejects(readRepositoryFile(root,'src/linked/private.rs'),MissingError);
  }finally{await rm(base,{recursive:true,force:true});}
});

test('repository excludes file symlinks when supported',async(t)=>{
  const root=await mkdtemp(join(tmpdir(),'prism-symlink-'));
  try{
    await mkdir(join(root,'src'));
    await writeFile(join(root,'README.md'),'# Demo');
    try{
      await symlink(join(root,'README.md'),join(root,'src','link.md'),'file');
    }catch(e){
      const code=(e as NodeJS.ErrnoException).code;
      if(process.platform==='win32'&&(code==='EPERM'||code==='EACCES')){
        t.skip('Windows does not grant file-symlink creation; junction coverage runs separately');
        return;
      }
      throw e;
    }
    assert.deepEqual((await indexRepository(root)).files.map(f=>f.path),['README.md']);
    await assert.rejects(readRepositoryFile(root,'src/link.md'),MissingError);
  }finally{await rm(root,{recursive:true,force:true});}
});

test('repository browser includes application server and shared source',async()=>{
  const root=await mkdtemp(join(tmpdir(),'prism-self-source-'));
  try{
    for(const dir of ['src','server','shared','.prism','node_modules'])await mkdir(join(root,dir));
    for(const path of ['src/App.tsx','server/index.ts','shared/records.ts','.prism/hidden.md','node_modules/private.ts','tsconfig.json'])await writeFile(join(root,path),'sample');
    assert.deepEqual((await indexRepository(root)).files.map(f=>f.path),['server/index.ts','shared/records.ts','src/App.tsx','tsconfig.json']);
    assert.equal((await readRepositoryFile(root,'server/index.ts')).content,'sample');
    assert.equal((await readRepositoryFile(root,'shared/records.ts')).content,'sample');
    await assert.rejects(readRepositoryFile(root,'.prism/hidden.md'),MissingError);
  }finally{await rm(root,{recursive:true,force:true});}
});

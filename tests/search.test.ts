import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp,mkdir,rm,writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { recordSchema,type ProjectRecord } from '../shared/records';
import { projectPropertySchema } from '../shared/customProperties';
import { searchInputSchema,searchRecords,searchTerms } from '../shared/search';
import { searchRepository } from '../server/search';
const rec=(id:string,title:string,body='',more:Record<string,unknown>={}):ProjectRecord=>({...recordSchema.parse({id,title,body,type:'Task',status:'Concept',priority:'Normal',accent:'teal',tags:[],relationships:[],...more}),revision:'a'.repeat(64)});
test('search matches across canonical fields, ranks title hits, identifies typed value provenance and bounds results',()=>{
 const schema=projectPropertySchema.parse({version:1,entityTypes:[{id:'incident',label:'Incident',baseType:'Task'}],fields:[{id:'level',label:'Severity',kind:'enum',options:[{id:'p1',label:'Critical'}]},{id:'target',label:'Target',kind:'reference'}]});
 const a=rec('one','Critical issue','',{customTypeId:'incident',customProperties:{level:'p1',target:'two'}}),b=rec('two','Network gateway','critical issue'),c=rec('three','Other','unrelated');
 const records=[b,c,a];
 const ranked=searchRecords(records,schema,searchTerms('CRITICAL issue'));
 assert.deepEqual(ranked.hits.map(r=>r.id),['one','two']);assert.equal(ranked.total,2);
 const typed=searchRecords(records,schema,searchTerms('incident severity gateway'));assert.equal(typed.hits[0].id,'one');assert.ok(typed.hits[0].matches.some(m=>m.field==='Target'&&m.excerpt.includes('Network gateway')));
 assert.equal(searchRecords(records,undefined,searchTerms('p1')).hits[0].id,'one');assert.equal(searchRecords(records,schema,[]).total,0);
 const many=searchRecords(Array.from({length:105},(_,i)=>rec('item-'+i,'match')),undefined,['match']);assert.equal(many.total,105);assert.equal(many.hits.length,100);
 assert.equal(searchInputSchema.safeParse({query:'   '}).success,false);assert.equal(searchInputSchema.safeParse({query:'x',root:'/tmp'}).success,false);
});
test('repository search reads allowlisted local paths and content, with explicit incomplete counts',async()=>{
 const root=await mkdtemp(join(tmpdir(),'prism-search-'));
 try{
  await mkdir(join(root,'docs'));await mkdir(join(root,'src'));await mkdir(join(root,'.prism'));await mkdir(join(root,'node_modules'));
  await writeFile(join(root,'docs','guide.md'),'gateway searchmarker');
  await writeFile(join(root,'src','worker.ts'),'const example = "searchmarker";');
  await writeFile(join(root,'src','oversize.ts'),'searchmarker'+'x'.repeat(520000));
  await writeFile(join(root,'.prism','secret.md'),'searchmarker');
  await writeFile(join(root,'node_modules','ignored.md'),'searchmarker');
  const found=await searchRepository(root,['searchmarker']);
  assert.deepEqual(found.hits.map(f=>f.path).sort(),['docs/guide.md','src/worker.ts']);
  assert.deepEqual(found.repository,{state:'searched',indexed:3,scanned:2,unread:1,truncated:true});
  assert.ok(found.hits.every(f=>f.previewAvailable&&f.matches.some(m=>m.field==='Content')));
  const pathOnly=await searchRepository(root,['oversize']);assert.equal(pathOnly.hits[0].previewAvailable,false);
 }finally{await rm(root,{recursive:true,force:true});}
});

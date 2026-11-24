import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp,writeFile,rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import { metadataSchema,editableSchema } from '../shared/records';

test('Zod preserves extra metadata but rejects extra mutation fields',()=>{
  const common={title:'Example',type:'Idea',status:'Concept',priority:'Normal',accent:'teal',tags:[],relationships:[]};
  const value=metadataSchema.parse({id:'example',...common,custom:'keep'});
  assert.equal(value.custom,'keep');
  assert.equal(editableSchema.safeParse({...common,body:'text'}).success,true);
  assert.equal(editableSchema.safeParse({...common,body:'text',custom:'reject'}).success,false);
});

test('Fastify static plugin serves a local build file',async()=>{
  const root=await mkdtemp(join(tmpdir(),'prism-static-'));
  const app=Fastify();
  try{
    await writeFile(join(root,'index.html'),'Prism build');
    await app.register(fastifyStatic,{root});
    const response=await app.inject({method:'GET',url:'/'});
    assert.equal(response.statusCode,200);
    assert.equal(response.body,'Prism build');
    assert.equal((await app.inject({method:'GET',url:'/missing.html'})).statusCode,404);
  }finally{await app.close();await rm(root,{recursive:true,force:true});}
});

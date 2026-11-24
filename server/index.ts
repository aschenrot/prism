import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { ZodError } from 'zod';
import { createSchema, idSchema, updateSchema, propertyUpdateSchema } from '../shared/records';
import { ConflictError, MissingError, CustomPropertyError } from './store';
import { schemaUpdateSchema } from '../shared/customProperties';
import { SchemaWriteConflict,SchemaWriteRejected } from './projectSchema';
import { loadProjects } from './projects';
import { indexRepository, readRepositoryFile } from './repository';
import { searchInputSchema,searchRecords,searchTerms,type ProjectSearchResult } from '../shared/search';
import { searchRepository } from './search';
import { gitHistory } from './git';
import { readVerification,readBrowserVerification } from './verification';
import { hostedRuns,hostedPull,hostedJobs } from './hostedVerification';
import { githubIdSchema } from '../shared/hostedVerification';
import { z } from 'zod';
import { viewInputSchema } from '../shared/views';
import { templateInputSchema,templateUpdateSchema,instantiateTemplateSchema } from '../shared/templates';
import { startAcceptanceSchema,updateAcceptanceSchema } from '../shared/acceptance';

const projects = await loadProjects();
const app = Fastify({ logger:true, bodyLimit: 1_000_000 });
const localHosts = new Set(['127.0.0.1:4174','localhost:4174','127.0.0.1:5173','localhost:5173']);
app.addHook('onRequest', async (request, reply) => {
  if (!localHosts.has(request.headers.host || '')) return reply.code(403).send({error:'Local access only'});
  const origin = request.headers.origin;
  if (origin && ![...localHosts].some(host => origin === 'http://' + host)) return reply.code(403).send({error:'Origin not allowed'});
  if (request.method === 'POST' || request.method === 'PUT' || request.method === 'DELETE') {
    if (!request.headers['content-type']?.startsWith('application/json')) return reply.code(415).send({error:'JSON required'});
  }
});
app.setErrorHandler((err, request, reply) => {
  if (err instanceof ZodError) return reply.code(400).send({error:err.issues.map(i => i.message).join('; ')});
  if(err instanceof SchemaWriteConflict)return reply.code(409).send({error:err.message});
  if(err instanceof SchemaWriteRejected)return reply.code(422).send({error:err.message});
  if (err instanceof CustomPropertyError) return reply.code(422).send({error:err.message});
  if (err instanceof ConflictError) return reply.code(409).send({error:err.message});
  if (err instanceof MissingError) return reply.code(404).send({error:err.message});
  if (typeof err === 'object' && err !== null && 'statusCode' in err) {
    const status = err.statusCode;
    if (typeof status === 'number' && Number.isInteger(status) && status >= 400 && status < 500) {
      return reply.code(status).send({error:'Invalid request'});
    }
  }
  request.log.error(err); return reply.code(500).send({error:'Storage operation failed'});
});
const projectFor = (request:{params:unknown}) => projects.get(idSchema.parse((request.params as {projectId:string}).projectId));
app.get('/api/projects', async () => projects.list());
app.get('/api/projects/:projectId/schema',async request=>projectFor(request).store.schema());
app.put('/api/projects/:projectId/schema',async request=>{const input=schemaUpdateSchema.parse(request.body);return projectFor(request).store.updateSchema(input.expectedRevision,input.definition);});
app.get('/api/projects/:projectId/records', async request => projectFor(request).store.list());
app.post('/api/projects/:projectId/search',async(request,reply)=>{
 const p=projectFor(request),{query}=searchInputSchema.parse(request.body),terms=searchTerms(query);
 reply.header('Cache-Control','no-store');
 const [list,schema]=await Promise.all([p.store.list(),p.store.schema()]);
 const records=searchRecords(list.records,schema.state==='available'?schema.definition:undefined,terms);
 const result:ProjectSearchResult={query,records:records.hits,recordMatches:records.total,files:[],fileMatches:0,recordErrors:list.errors.length,schemaAvailable:schema.state==='available',repository:{state:'unavailable'}};
 if(p.info.storage==='repository'){const found=await searchRepository(p.root,terms);result.files=found.hits;result.fileMatches=found.total;result.repository=found.repository;}
 return result;
});
app.get('/api/projects/:projectId/repository', async request => {const p=projectFor(request);return p.info.storage==='repository'?indexRepository(p.root):{files:[],truncated:false};});
app.get('/api/projects/:projectId/verification',async request=>{const p=projectFor(request);if(p.info.storage!=='repository')throw new MissingError('No connected repository');return readVerification(p.root);});
app.get('/api/projects/:projectId/browser-verification',async request=>{const p=projectFor(request);if(p.info.storage!=='repository')throw new MissingError('No connected repository');return readBrowserVerification(p.root);});
// Outbound reads require explicit local JSON action and a registry-configured public repository.
app.post('/api/projects/:projectId/hosted-verification',async(request,reply)=>{
  z.strictObject({}).parse(request.body);
  const p=projectFor(request);
  reply.header('Cache-Control','no-store');
  if(p.info.storage!=='repository'||!p.info.githubRepository)return {state:'unavailable',message:'No public GitHub repository configured.'};
  return hostedRuns(p.info.githubRepository);
});
app.post('/api/projects/:projectId/records/:id/hosted-pull',async(request,reply)=>{
 const p=projectFor(request),input=z.strictObject({number:githubIdSchema}).parse(request.body),id=idSchema.parse((request.params as {id:string}).id);
 reply.header('Cache-Control','no-store');
 if(p.info.storage!=='repository'||!p.info.githubRepository)return {state:'unavailable',message:'No public GitHub repository configured.'};
 const record=await p.store.get(id);
 if(record.type!=='Increment'||!record.githubPullRequests?.some(ref=>ref.repository.toLowerCase()===p.info.githubRepository!.toLowerCase()&&ref.number===input.number))throw new MissingError('No matching authored pull request reference');
 return hostedPull(p.info.githubRepository,input.number);
});
app.post('/api/projects/:projectId/hosted-jobs',async(request,reply)=>{
 const p=projectFor(request),input=z.strictObject({runId:githubIdSchema,attempt:githubIdSchema}).parse(request.body);
 reply.header('Cache-Control','no-store');
 if(p.info.storage!=='repository'||!p.info.githubRepository)return {state:'unavailable',message:'No public GitHub repository configured.'};
 // Limit details to a recently observed run/attempt from the configured repository.
 const observed=await hostedRuns(p.info.githubRepository);
 if(observed.state!=='available')return observed;
 if(!observed.runs.some(run=>run.id===input.runId&&run.attempt===input.attempt))return {state:'unavailable',message:'Run attempt is no longer in the recent observation. Refresh workflow runs.'};
 return hostedJobs(p.info.githubRepository,input.runId,input.attempt);
});
app.get('/api/projects/:projectId/changes',async request=>{const p=projectFor(request);if(p.info.storage!=='repository')throw new MissingError('No connected repository');return gitHistory(p.root);});
app.get('/api/projects/:projectId/file', async request => {const p=projectFor(request);if(p.info.storage!=='repository')throw new MissingError('No connected repository');return readRepositoryFile(p.root,z.object({path:z.string().min(1).max(500)}).parse(request.query).path);});
app.post('/api/projects/:projectId/records', async (request, reply) => {
  const input = createSchema.parse(request.body);
  return reply.code(201).send(await projectFor(request).store.create(input.title,input.type,input.customTypeId,input.expectedSchemaRevision));
});
app.put('/api/projects/:projectId/records/:id', async request => {
  const id = idSchema.parse((request.params as {id:string}).id);
  const input = updateSchema.parse(request.body);
  return projectFor(request).store.update(id,input.expectedRevision,input.changes,input.expectedSchemaRevision);
});
const expectedRevision=z.string().regex(/^[a-f0-9]{64}$/);
app.put('/api/projects/:projectId/records/:id/properties',async request=>{const id=idSchema.parse((request.params as {id:string}).id);const input=propertyUpdateSchema.parse(request.body);return projectFor(request).store.updateProperties(id,input.expectedRevision,input.changes);});
app.post('/api/projects/:projectId/records/:id/duplicate',async(request,reply)=>{const id=idSchema.parse((request.params as {id:string}).id);const input=z.strictObject({expectedRevision}).parse(request.body);return reply.code(201).send(await projectFor(request).store.duplicate(id,input.expectedRevision));});
app.get('/api/projects/:projectId/trash',async request=>projectFor(request).store.listTrash());
app.post('/api/projects/:projectId/records/:id/trash',async request=>{const id=idSchema.parse((request.params as {id:string}).id);const input=z.strictObject({expectedRevision}).parse(request.body);return projectFor(request).store.moveToTrash(id,input.expectedRevision);});
app.post('/api/projects/:projectId/trash/:id/restore',async request=>{const id=idSchema.parse((request.params as {id:string}).id);const input=z.strictObject({expectedRevision}).parse(request.body);return projectFor(request).store.restoreTrash(id,input.expectedRevision);});
const viewId=(request:{params:unknown})=>idSchema.parse((request.params as {id:string}).id);
app.get('/api/projects/:projectId/templates',async request=>projectFor(request).templates.list());
app.post('/api/projects/:projectId/templates',async(request,reply)=>reply.code(201).send(await projectFor(request).templates.create(templateInputSchema.parse(request.body))));
app.put('/api/projects/:projectId/templates/:id',async request=>{const input=templateUpdateSchema.parse(request.body);return projectFor(request).templates.update(viewId(request),input.expectedRevision,input.template);});
app.post('/api/projects/:projectId/templates/:id/instantiate',async(request,reply)=>{const p=projectFor(request),input=instantiateTemplateSchema.parse(request.body);return reply.code(201).send(await p.store.instantiateTemplate(p.templates,viewId(request),input.expectedRevision,input.title,input.expectedSchemaRevision));});
app.get('/api/projects/:projectId/views',async request=>projectFor(request).views.list());
app.post('/api/projects/:projectId/views',async (request,reply)=>reply.code(201).send(await projectFor(request).views.create(viewInputSchema.parse(request.body))));
app.put('/api/projects/:projectId/views/:id',async request=>{
  const input=z.object({expectedRevision,view:viewInputSchema}).strict().parse(request.body);
  return projectFor(request).views.update(viewId(request),input.expectedRevision,input.view);
});
app.delete('/api/projects/:projectId/views/:id',async request=>{
  const input=z.object({expectedRevision}).strict().parse(request.body);
  return projectFor(request).views.remove(viewId(request),input.expectedRevision);
});
const acceptanceParams=z.object({testId:idSchema});
const runParams=z.object({testId:idSchema,runId:idSchema});
app.get('/api/projects/:projectId/acceptance/:testId',async request=>projectFor(request).acceptance.list(acceptanceParams.parse(request.params).testId));
app.post('/api/projects/:projectId/acceptance/:testId',async (request,reply)=>reply.code(201).send(await projectFor(request).acceptance.create(acceptanceParams.parse(request.params).testId,startAcceptanceSchema.parse(request.body))));
app.get('/api/projects/:projectId/acceptance/:testId/:runId',async request=>{const {testId,runId}=runParams.parse(request.params);return projectFor(request).acceptance.get(testId,runId);});
app.put('/api/projects/:projectId/acceptance/:testId/:runId',async request=>{const {testId,runId}=runParams.parse(request.params);return projectFor(request).acceptance.update(testId,runId,updateAcceptanceSchema.parse(request.body));});
const dist = resolve('dist');
if (existsSync(dist)) await app.register(fastifyStatic,{root:dist});
await app.listen({host:'127.0.0.1',port:4174});

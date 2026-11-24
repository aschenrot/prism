import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { ZodError } from 'zod';
import { createSchema, idSchema, updateSchema, propertyUpdateSchema } from '../shared/records';
import { ConflictError, MissingError } from './store';
import { loadProjects } from './projects';
import { indexRepository, readRepositoryFile } from './repository';
import { gitHistory } from './git';
import { readVerification,readBrowserVerification } from './verification';
import { z } from 'zod';
import { viewInputSchema } from '../shared/views';
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
app.get('/api/projects/:projectId/records', async request => projectFor(request).store.list());
app.get('/api/projects/:projectId/repository', async request => {const p=projectFor(request);return p.info.storage==='repository'?indexRepository(p.root):{files:[],truncated:false};});
app.get('/api/projects/:projectId/verification',async request=>{const p=projectFor(request);if(p.info.storage!=='repository')throw new MissingError('No connected repository');return readVerification(p.root);});
app.get('/api/projects/:projectId/browser-verification',async request=>{const p=projectFor(request);if(p.info.storage!=='repository')throw new MissingError('No connected repository');return readBrowserVerification(p.root);});
app.get('/api/projects/:projectId/changes',async request=>{const p=projectFor(request);if(p.info.storage!=='repository')throw new MissingError('No connected repository');return gitHistory(p.root);});
app.get('/api/projects/:projectId/file', async request => {const p=projectFor(request);if(p.info.storage!=='repository')throw new MissingError('No connected repository');return readRepositoryFile(p.root,z.object({path:z.string().min(1).max(500)}).parse(request.query).path);});
app.post('/api/projects/:projectId/records', async (request, reply) => {
  const input = createSchema.parse(request.body);
  return reply.code(201).send(await projectFor(request).store.create(input.title,input.type));
});
app.put('/api/projects/:projectId/records/:id', async request => {
  const id = idSchema.parse((request.params as {id:string}).id);
  const input = updateSchema.parse(request.body);
  return projectFor(request).store.update(id,input.expectedRevision,input.changes);
});
const expectedRevision=z.string().regex(/^[a-f0-9]{64}$/);
app.put('/api/projects/:projectId/records/:id/properties',async request=>{const id=idSchema.parse((request.params as {id:string}).id);const input=propertyUpdateSchema.parse(request.body);return projectFor(request).store.updateProperties(id,input.expectedRevision,input.changes);});
app.post('/api/projects/:projectId/records/:id/duplicate',async(request,reply)=>{const id=idSchema.parse((request.params as {id:string}).id);const input=z.strictObject({expectedRevision}).parse(request.body);return reply.code(201).send(await projectFor(request).store.duplicate(id,input.expectedRevision));});
app.get('/api/projects/:projectId/trash',async request=>projectFor(request).store.listTrash());
app.post('/api/projects/:projectId/records/:id/trash',async request=>{const id=idSchema.parse((request.params as {id:string}).id);const input=z.strictObject({expectedRevision}).parse(request.body);return projectFor(request).store.moveToTrash(id,input.expectedRevision);});
app.post('/api/projects/:projectId/trash/:id/restore',async request=>{const id=idSchema.parse((request.params as {id:string}).id);const input=z.strictObject({expectedRevision}).parse(request.body);return projectFor(request).store.restoreTrash(id,input.expectedRevision);});
const viewId=(request:{params:unknown})=>idSchema.parse((request.params as {id:string}).id);
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

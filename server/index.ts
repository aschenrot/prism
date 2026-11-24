import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { ZodError } from 'zod';
import { createSchema, idSchema, updateSchema } from '../shared/records';
import { RecordStore, ConflictError, MissingError } from './store';

const store = await RecordStore.open(process.env.PRISM_PROJECT || resolve('workspace'));
const app = Fastify({ logger:true, bodyLimit: 1_000_000 });
const localHosts = new Set(['127.0.0.1:4174','localhost:4174','127.0.0.1:5173','localhost:5173']);
app.addHook('onRequest', async (request, reply) => {
  if (!localHosts.has(request.headers.host || '')) return reply.code(403).send({error:'Local access only'});
  const origin = request.headers.origin;
  if (origin && ![...localHosts].some(host => origin === 'http://' + host)) return reply.code(403).send({error:'Origin not allowed'});
  if (request.method === 'POST' || request.method === 'PUT') {
    if (!request.headers['content-type']?.startsWith('application/json')) return reply.code(415).send({error:'JSON required'});
  }
});
app.setErrorHandler((err, request, reply) => {
  if (err instanceof ZodError) return reply.code(400).send({error:err.issues.map(i => i.message).join('; ')});
  if (err instanceof ConflictError) return reply.code(409).send({error:err.message});
  if (err instanceof MissingError) return reply.code(404).send({error:err.message});
  if (err.statusCode && err.statusCode < 500) return reply.code(err.statusCode).send({error:'Invalid request'});
  request.log.error(err); return reply.code(500).send({error:'Storage operation failed'});
});
app.get('/api/records', async () => store.list());
app.post('/api/records', async (request, reply) => {
  const input = createSchema.parse(request.body);
  return reply.code(201).send(await store.create(input.title,input.type));
});
app.put('/api/records/:id', async request => {
  const id = idSchema.parse((request.params as {id:string}).id);
  const input = updateSchema.parse(request.body);
  return store.update(id,input.expectedRevision,input.changes);
});
const dist = resolve('dist');
if (existsSync(dist)) await app.register(fastifyStatic,{root:dist});
await app.listen({host:'127.0.0.1',port:4174});

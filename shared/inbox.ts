import { z } from 'zod';
import { editableSchema } from './records';
export const captureSchema=z.strictObject({title:editableSchema.shape.title,body:z.string().max(50000)});
export const inboxUpdateSchema=z.strictObject({expectedRevision:z.string().regex(/^[a-f0-9]{64}$/),inbox:z.boolean()});

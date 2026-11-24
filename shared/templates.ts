import { z } from 'zod';
import { editableSchema,idSchema } from './records';
const revision=z.string().regex(/^[a-f0-9]{64}$/);
export const templateInputSchema=z.strictObject({
 name:z.string().trim().min(1).max(100),
 title:editableSchema.shape.title,type:editableSchema.shape.type,priority:editableSchema.shape.priority,accent:editableSchema.shape.accent,
 tags:editableSchema.shape.tags.refine(tags=>!tags.some(t=>['acceptance','current','blocker','inbox'].includes(t.toLowerCase())),'Reserved workflow tags cannot be copied by templates'),
 body:z.string().max(50000),customTypeId:editableSchema.shape.customTypeId,customProperties:editableSchema.shape.customProperties,retired:z.boolean().optional()
});
export const templateSchema=templateInputSchema.extend({id:idSchema,version:z.literal(1)});
export const templateUpdateSchema=z.strictObject({expectedRevision:revision,template:templateInputSchema});
export const instantiateTemplateSchema=z.strictObject({expectedRevision:revision,title:editableSchema.shape.title,expectedSchemaRevision:revision.optional()});
export type TemplateInput=z.infer<typeof templateInputSchema>;
export type RecordTemplate=z.infer<typeof templateSchema>&{revision:string};
export type TemplateList={templates:RecordTemplate[];errors:{file:string;message:string}[]};
export function templateValues(template:RecordTemplate):TemplateInput{const {id,version,revision,...values}=template;return values;}

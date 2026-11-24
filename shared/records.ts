import { z } from 'zod';
export const types = ['Idea', 'Mechanic', 'Asset', 'Character', 'Location', 'System', 'Task', 'Decision', 'Objective', 'Feature', 'Requirement', 'Milestone', 'Risk', 'Research', 'Document', 'Test'] as const;
export const statuses = ['Concept', 'In progress', 'Ready'] as const;
export const priorities = ['Low', 'Normal', 'High'] as const;
export const accents = ['amber', 'violet', 'teal', 'blue', 'rose'] as const;
export const idSchema = z.string().regex(/^[a-z0-9][a-z0-9-]{0,95}$/);
export const metadataSchema = z.object({
  id: idSchema,
  title: z.string().trim().min(1).max(160),
  type: z.enum(types),
  status: z.enum(statuses),
  priority: z.enum(priorities),
  accent: z.enum(accents),
  tags: z.array(z.string().trim().min(1).max(60)).max(30),
  relationships: z.array(idSchema).max(200)
}).passthrough();
export const recordSchema = metadataSchema.extend({ body: z.string().max(500_000) });
export const editableSchema = recordSchema.pick({title:true,type:true,status:true,priority:true,accent:true,tags:true,relationships:true,body:true}).strict();
export const updateSchema = z.object({ expectedRevision: z.string().regex(/^[a-f0-9]{64}$/), changes: editableSchema }).strict();
export const createSchema = z.object({title: z.string().trim().min(1).max(160), type:z.enum(types)}).strict();
export type Editable = z.infer<typeof editableSchema>;
export type ProjectRecord = z.infer<typeof recordSchema> & { revision: string };
export type RecordList = { records: ProjectRecord[]; errors: { file: string; message: string }[] };

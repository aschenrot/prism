import { z } from 'zod';
export const types = ['Idea', 'Mechanic', 'Asset', 'Character', 'Location', 'System', 'Task', 'Decision', 'Objective', 'Feature', 'Requirement', 'Milestone', 'Risk', 'Research', 'Document', 'Test'] as const;
export const statuses = ['Concept', 'In progress', 'Ready'] as const;
export const priorities = ['Low', 'Normal', 'High'] as const;
export const accents = ['amber', 'violet', 'teal', 'blue', 'rose'] as const;
export const idSchema = z.string().regex(/^[a-z0-9][a-z0-9-]{0,95}$/);
// Legacy string references remain valid and mean only "related to".
export const relationshipKinds=['related-to','implements','verifies','depends-on','blocks','documents'] as const;
export const relationshipKindSchema=z.enum(relationshipKinds);
export const relationshipSchema=z.union([idSchema,z.strictObject({kind:relationshipKindSchema,target:idSchema})]);
export type Relationship=z.infer<typeof relationshipSchema>;
export type RelationshipKind=z.infer<typeof relationshipKindSchema>;
const metadataShape = {
  id: idSchema,
  title: z.string().trim().min(1).max(160),
  type: z.enum(types),
  status: z.enum(statuses),
  priority: z.enum(priorities),
  accent: z.enum(accents),
  tags: z.array(z.string().trim().min(1).max(60)).max(30),
  relationships: z.array(relationshipSchema).max(200),
  // Explicit, reviewed historical attribution; not editable via ordinary record mutations.
  implementationCommits: z.array(z.string().regex(/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/)).max(100).optional()
};
export const metadataSchema = z.looseObject(metadataShape);
export const recordSchema = metadataSchema.extend({ body: z.string().max(500_000) });
// Preserve unknown on-disk metadata but reject unrecognized API mutation fields.
export const editableSchema = z.strictObject({title:metadataShape.title,type:metadataShape.type,status:metadataShape.status,priority:metadataShape.priority,accent:metadataShape.accent,tags:metadataShape.tags,relationships:metadataShape.relationships,body:z.string().max(500_000)});
export const updateSchema = z.object({ expectedRevision: z.string().regex(/^[a-f0-9]{64}$/), changes: editableSchema }).strict();
export const createSchema = z.object({title: z.string().trim().min(1).max(160), type:z.enum(types)}).strict();
export type Editable = z.infer<typeof editableSchema>;
export type ProjectRecord = z.infer<typeof recordSchema> & { revision: string };
export type RecordList = { records: ProjectRecord[]; errors: { file: string; message: string }[] };

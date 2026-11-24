import { z } from 'zod';
import { pullReferencesSchema } from './hostedVerification';
import { types } from './recordTypes';
import { customValuesSchema,schemaId } from './customProperties';
export { types } from './recordTypes';
export const statuses = ['Concept', 'In progress', 'Ready'] as const;
export const priorities = ['Low', 'Normal', 'High'] as const;
export const accents = ['amber', 'violet', 'teal', 'blue', 'rose'] as const;
export const idSchema = z.string().regex(/^[a-z0-9][a-z0-9-]{0,95}$/);
// Legacy string references remain valid and mean only "related to".
export const relationshipKinds=['related-to','implements','verifies','depends-on','blocks','documents','contains'] as const;
export const relationshipKindSchema=z.enum(relationshipKinds);
export const relationshipSchema=z.union([idSchema,z.strictObject({kind:relationshipKindSchema,target:idSchema})]);
export type Relationship=z.infer<typeof relationshipSchema>;
export type RelationshipKind=z.infer<typeof relationshipKindSchema>;
// Authored timestamps are optional for older records; never infer them from file mtime.
const recordTimestamp=z.iso.datetime({offset:true});
const metadataShape = {
  id: idSchema,
  title: z.string().trim().min(1).max(160),
  type: z.enum(types),
  status: z.enum(statuses),
  priority: z.enum(priorities),
  accent: z.enum(accents),
  tags: z.array(z.string().trim().min(1).max(60)).max(30),
  relationships: z.array(relationshipSchema).max(200),
  createdAt:recordTimestamp.optional(),
  updatedAt:recordTimestamp.optional(),
  // Explicit, reviewed historical attribution; not editable via ordinary record mutations.
  githubPullRequests: pullReferencesSchema.optional(),
  customProperties: customValuesSchema.optional(),
  customTypeId:schemaId.nullable().optional(),
  implementationCommits: z.array(z.string().regex(/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/)).max(100).optional()
};
export const metadataSchema = z.looseObject(metadataShape);
export const recordSchema = metadataSchema.extend({ body: z.string().max(500_000) });
// Preserve unknown on-disk metadata but reject unrecognized API mutation fields.
export const editableSchema = z.strictObject({title:metadataShape.title,type:metadataShape.type,status:metadataShape.status,priority:metadataShape.priority,accent:metadataShape.accent,tags:metadataShape.tags,relationships:metadataShape.relationships,customProperties:metadataShape.customProperties,customTypeId:metadataShape.customTypeId,body:z.string().max(500_000)});
export const updateSchema = z.object({ expectedRevision: z.string().regex(/^[a-f0-9]{64}$/), changes: editableSchema, expectedSchemaRevision:z.string().regex(/^[a-f0-9]{64}$/).optional() }).strict();
export const createSchema = z.object({title: z.string().trim().min(1).max(160), type:z.enum(types)}).strict();
export const propertyChangesSchema=z.strictObject({status:metadataShape.status.optional(),priority:metadataShape.priority.optional()}).refine(v=>v.status!==undefined||v.priority!==undefined,'Choose a property to change');
export const propertyUpdateSchema=z.strictObject({expectedRevision:updateSchema.shape.expectedRevision,changes:propertyChangesSchema});
export type PropertyChanges=z.infer<typeof propertyChangesSchema>;
export type Editable = z.infer<typeof editableSchema>;
export type ProjectRecord = z.infer<typeof recordSchema> & { revision: string };
// Trash preserves the original record and revision; no permanent deletion API.
export type TrashList = { records: ProjectRecord[]; errors: { file: string; message: string }[] };
export type RecordList = { records: ProjectRecord[]; errors: { file: string; message: string }[] };

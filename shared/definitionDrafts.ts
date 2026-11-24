import {z} from 'zod';
import {types} from './records';
import {projectPropertySchema,propertyDefinitionSchema,entityDefinitionSchema,type ProjectPropertySchema,type PropertyDefinition,type EntityDefinition} from './customProperties';
import {templateSchema,templateInputSchema,type RecordTemplate,type TemplateInput} from './templates';
const revision=z.string().regex(/^[a-f0-9]{64}$/);
const id=z.string().max(48),label=z.string().max(100),scope=z.array(z.enum(types)).max(types.length);
const base={id,label,appliesTo:scope.optional(),appliesToEntities:z.array(id).max(40).optional(),retired:z.boolean().optional()};
const propertyDraft=z.discriminatedUnion('kind',[
 z.strictObject({...base,kind:z.literal('text')}),z.strictObject({...base,kind:z.literal('number')}),z.strictObject({...base,kind:z.literal('date')}),z.strictObject({...base,kind:z.literal('boolean')}),
 z.strictObject({...base,kind:z.literal('enum'),options:z.array(z.strictObject({id,label})).max(40)}),z.strictObject({...base,kind:z.literal('reference'),targetTypes:scope.optional()})
]);
export type PropertyForm={revision:string;base:ProjectPropertySchema;original?:PropertyDefinition;draft:PropertyDefinition};
export type EntityForm={revision:string;base:ProjectPropertySchema;original?:EntityDefinition;draft:EntityDefinition};
export type TemplateForm={original:RecordTemplate|null;draft:TemplateInput};
export const propertyFormSchema:z.ZodType<PropertyForm>=z.strictObject({revision,base:projectPropertySchema,original:propertyDefinitionSchema.optional(),draft:propertyDraft});
export const entityFormSchema:z.ZodType<EntityForm>=z.strictObject({revision,base:projectPropertySchema,original:entityDefinitionSchema.optional(),draft:z.strictObject({id,label,baseType:z.enum(types),retired:z.boolean().optional()})});
export const templateFormSchema:z.ZodType<TemplateForm>=z.strictObject({original:templateSchema.extend({revision}).nullable(),draft:z.strictObject({...templateInputSchema.shape,name:z.string().max(100),title:z.string().max(160),tags:z.array(z.string().max(4000)).max(4001)})});

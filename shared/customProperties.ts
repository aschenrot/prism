import { z } from 'zod';
import { types } from './recordTypes';
export const schemaId=z.string().regex(/^[a-z][a-z0-9-]{0,47}$/).refine(id=>id!=='constructor'&&id!=='prototype','Reserved property identifier');
const fieldId=schemaId;
const name=z.string().trim().min(1).max(100);
const recordId=z.string().regex(/^[a-z0-9][a-z0-9-]{0,95}$/);
const scope=z.array(z.enum(types)).min(1).max(types.length).refine(v=>new Set(v).size===v.length,'Duplicate record types');
const entityScope=z.array(schemaId).min(1).max(40).refine(v=>new Set(v).size===v.length,'Duplicate entity IDs');
export const entityDefinitionSchema=z.strictObject({id:schemaId,label:name,baseType:z.enum(types),retired:z.boolean().optional()});
export type EntityDefinition=z.infer<typeof entityDefinitionSchema>;
const base={id:fieldId,label:name,appliesTo:scope.optional(),appliesToEntities:entityScope.optional(),retired:z.boolean().optional()};
export const propertyDefinitionSchema=z.discriminatedUnion('kind',[
 z.strictObject({...base,kind:z.literal('text')}),
 z.strictObject({...base,kind:z.literal('number')}),
 z.strictObject({...base,kind:z.literal('date')}),
 z.strictObject({...base,kind:z.literal('boolean')}),
 z.strictObject({...base,kind:z.literal('enum'),options:z.array(z.strictObject({id:fieldId,label:name})).min(1).max(40).refine(v=>new Set(v.map(o=>o.id)).size===v.length,'Duplicate option IDs')}),
 z.strictObject({...base,kind:z.literal('reference'),targetTypes:scope.optional()})
]);
export const projectPropertySchema=z.strictObject({
 version:z.literal(1),
 fields:z.array(propertyDefinitionSchema).max(50).refine(v=>new Set(v.map(f=>f.id)).size===v.length,'Duplicate property IDs'),
 entityTypes:z.array(entityDefinitionSchema).max(40).refine(v=>new Set(v.map(e=>e.id)).size===v.length,'Duplicate entity type IDs').optional()
}).superRefine((schema,ctx)=>{
 const entities=new Map((schema.entityTypes??[]).map(e=>[e.id,e]));
 for(const [index,field] of schema.fields.entries())for(const id of field.appliesToEntities??[]){
  const entity=entities.get(id);
  if(!entity||field.appliesTo&&!field.appliesTo.includes(entity.baseType))ctx.addIssue({code:'custom',path:['fields',index,'appliesToEntities'],message:'Unknown or incompatible entity type '+id});
 }
});
export const customValuesSchema=z.record(fieldId,z.union([z.string().max(2000),z.number(),z.boolean()])).refine(v=>Object.keys(v).length<=50,'Too many custom properties');
export type PropertyDefinition=z.infer<typeof propertyDefinitionSchema>;
export type ProjectPropertySchema=z.infer<typeof projectPropertySchema>;
export type CustomValues=z.infer<typeof customValuesSchema>;
export type CustomValue=CustomValues[string];
export type ProjectSchemaResult={state:'available';configured:boolean;revision:string;definition:ProjectPropertySchema}|{state:'error';message:string};
export function appliesTo(field:PropertyDefinition,type:typeof types[number],entityId?:string|null){return !field.retired&&(!field.appliesTo||field.appliesTo.includes(type))&&(!field.appliesToEntities||!!entityId&&field.appliesToEntities.includes(entityId));}
export function entityTypeIssue(schema:ProjectPropertySchema,type:typeof types[number],id:string|null|undefined,assigning:boolean){
 if(!id)return;
 const entity=schema.entityTypes?.find(e=>e.id===id);
 if(!entity||entity.baseType!==type)return 'Choose a custom entity type compatible with the record role, or clear the assignment.';
 if(assigning&&entity.retired)return 'Retired entity types cannot be assigned to new records.';
}
export function entityTypeLabel(schema:ProjectPropertySchema|undefined,id:string|null|undefined,role:typeof types[number]){
 if(!id)return role;
 const entity=schema?.entityTypes?.find(e=>e.id===id&&e.baseType===role);
 return (entity?.label??id)+' · '+role+(entity?.retired?' (retired)':'');
}
export function changedCustomKeys(before:CustomValues|undefined,after:CustomValues|undefined){
 const a=before??{},b=after??{};return [...new Set([...Object.keys(a),...Object.keys(b)])].filter(key=>a[key]!==b[key]);
}
export function customPropertyIssue(field:PropertyDefinition,type:typeof types[number],value:CustomValue|undefined,sourceId:string,target?:{id:string;type:typeof types[number]},entityId?:string|null):string|undefined{
 if(!appliesTo(field,type,entityId))return 'Property is not configured for this record type.';
 if(value===undefined)return;
 switch(field.kind){
  case 'text':return typeof value==='string'?undefined:'Enter text.';
  case 'number':return typeof value==='number'&&Number.isFinite(value)?undefined:'Enter a finite number.';
  case 'date':return z.iso.date().safeParse(value).success?undefined:'Enter a valid date (YYYY-MM-DD).';
  case 'boolean':return typeof value==='boolean'?undefined:'Choose Yes or No.';
  case 'enum':return typeof value==='string'&&field.options.some(o=>o.id===value)?undefined:'Choose a configured option.';
  case 'reference':return typeof value==='string'&&recordId.safeParse(value).success&&value!==sourceId&&target?.id===value&&(!field.targetTypes||field.targetTypes.includes(target.type))?undefined:'Choose an existing compatible record in this project.';
 }
}

export const schemaUpdateSchema=z.strictObject({expectedRevision:z.string().regex(/^[a-f0-9]{64}$/),definition:projectPropertySchema});
const sameScope=(a:readonly string[]|undefined,b:readonly string[]|undefined)=>JSON.stringify(a?[...a].sort():null)===JSON.stringify(b?[...b].sort():null);
// In-place editing is non-destructive: identities, types and scope of existing
// definitions cannot be changed. Retire rather than delete; add rather than convert.
export function schemaTransitionIssue(before:ProjectPropertySchema,after:ProjectPropertySchema):string|undefined{
 for(const old of before.entityTypes??[]){const next=after.entityTypes?.find(e=>e.id===old.id);if(!next)return 'Cannot delete entity type '+old.id+'. Retire it instead.';if(next.baseType!==old.baseType)return 'Built-in role is immutable for '+old.id+'.';}
 for(const old of before.fields){
  const next=after.fields.find(f=>f.id===old.id);
  if(!next)return 'Cannot delete property '+old.id+'. Retire it instead.';
  if(old.kind!==next.kind||!sameScope(old.appliesTo,next.appliesTo)||!sameScope(old.appliesToEntities,next.appliesToEntities))return 'Kind and record type scope are immutable for '+old.id+'. Create a new property.';
  if(old.kind==='reference'&&next.kind==='reference'&&!sameScope(old.targetTypes,next.targetTypes))return 'Reference target scope is immutable for '+old.id+'. Create a new property.';
  if(old.kind==='enum'&&next.kind==='enum'&&old.options.some(o=>!next.options.some(n=>n.id===o.id)))return 'Cannot remove or rename option IDs for '+old.id+'. Existing stored values must remain interpretable.';
 }
}

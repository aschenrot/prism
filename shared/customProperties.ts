import { z } from 'zod';
import { types } from './recordTypes';
const fieldId=z.string().regex(/^[a-z][a-z0-9-]{0,47}$/).refine(id=>id!=='constructor'&&id!=='prototype','Reserved property identifier');
const name=z.string().trim().min(1).max(100);
const recordId=z.string().regex(/^[a-z0-9][a-z0-9-]{0,95}$/);
const scope=z.array(z.enum(types)).min(1).max(types.length).refine(v=>new Set(v).size===v.length,'Duplicate record types');
const base={id:fieldId,label:name,appliesTo:scope.optional(),retired:z.boolean().optional()};
export const propertyDefinitionSchema=z.discriminatedUnion('kind',[
 z.strictObject({...base,kind:z.literal('text')}),
 z.strictObject({...base,kind:z.literal('number')}),
 z.strictObject({...base,kind:z.literal('date')}),
 z.strictObject({...base,kind:z.literal('boolean')}),
 z.strictObject({...base,kind:z.literal('enum'),options:z.array(z.strictObject({id:fieldId,label:name})).min(1).max(40).refine(v=>new Set(v.map(o=>o.id)).size===v.length,'Duplicate option IDs')}),
 z.strictObject({...base,kind:z.literal('reference'),targetTypes:scope.optional()})
]);
export const projectPropertySchema=z.strictObject({version:z.literal(1),fields:z.array(propertyDefinitionSchema).max(50).refine(v=>new Set(v.map(f=>f.id)).size===v.length,'Duplicate property IDs')});
export const customValuesSchema=z.record(fieldId,z.union([z.string().max(2000),z.number(),z.boolean()])).refine(v=>Object.keys(v).length<=50,'Too many custom properties');
export type PropertyDefinition=z.infer<typeof propertyDefinitionSchema>;
export type ProjectPropertySchema=z.infer<typeof projectPropertySchema>;
export type CustomValues=z.infer<typeof customValuesSchema>;
export type CustomValue=CustomValues[string];
export type ProjectSchemaResult={state:'available';configured:boolean;revision:string;definition:ProjectPropertySchema}|{state:'error';message:string};
export function appliesTo(field:PropertyDefinition,type:typeof types[number]){return !field.retired&&(!field.appliesTo||field.appliesTo.includes(type));}
export function changedCustomKeys(before:CustomValues|undefined,after:CustomValues|undefined){
 const a=before??{},b=after??{};return [...new Set([...Object.keys(a),...Object.keys(b)])].filter(key=>a[key]!==b[key]);
}
export function customPropertyIssue(field:PropertyDefinition,type:typeof types[number],value:CustomValue|undefined,sourceId:string,target?:{id:string;type:typeof types[number]}):string|undefined{
 if(!appliesTo(field,type))return 'Property is not configured for this record type.';
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
 for(const old of before.fields){
  const next=after.fields.find(f=>f.id===old.id);
  if(!next)return 'Cannot delete property '+old.id+'. Retire it instead.';
  if(old.kind!==next.kind||!sameScope(old.appliesTo,next.appliesTo))return 'Kind and record type scope are immutable for '+old.id+'. Create a new property.';
  if(old.kind==='reference'&&next.kind==='reference'&&!sameScope(old.targetTypes,next.targetTypes))return 'Reference target scope is immutable for '+old.id+'. Create a new property.';
  if(old.kind==='enum'&&next.kind==='enum'&&old.options.some(o=>!next.options.some(n=>n.id===o.id)))return 'Cannot remove or rename option IDs for '+old.id+'. Existing stored values must remain interpretable.';
 }
}

import { z } from 'zod';
import { idSchema, priorities, statuses, types, type ProjectRecord } from './records';
import { schemaId } from './customProperties';
import { tableColumnsSchema } from './tableColumns';
export const modes = ['Board','Table','Gallery','Slides','Wiki','Relationships'] as const;
export const sortFields=['Title','Priority','Status','Type','ID','Created','Last edited'] as const;
export const sortDirections=['Ascending','Descending'] as const;
export const filtersSchema=z.object({
  type:z.enum(['All records',...types]),
  status:z.enum(['Any status',...statuses]),
  priority:z.enum(['Any priority',...priorities]),
  search:z.string().max(300),
  sort:z.enum(sortFields),
  direction:z.enum(sortDirections).optional(),
  entityType:schemaId.optional()
}).strict();
export const viewInputSchema=z.object({title:z.string().trim().min(1).max(80),mode:z.enum(modes),filters:filtersSchema,tableColumns:tableColumnsSchema.optional()}).strict();
export const viewSchema=viewInputSchema.extend({id:idSchema,version:z.literal(1)}).strict();
export type Filters=z.infer<typeof filtersSchema>;
export type ViewInput=z.infer<typeof viewInputSchema>;
export type ViewDefinition=z.infer<typeof viewSchema>;
export type SavedView=ViewDefinition & {revision:string};
export type ViewList={views:SavedView[];errors:{file:string;message:string}[]};
export const defaultFilters:Filters={type:'All records',status:'Any status',priority:'Any priority',search:'',sort:'Title'};
// Old version-1 views retain their original ordering when direction is absent.
export function defaultSortDirection(sort:Filters['sort']):NonNullable<Filters['direction']>{return sort==='Priority'||sort==='Created'||sort==='Last edited'?'Descending':'Ascending';}
export function sortDirection(filters:Pick<Filters,'sort'|'direction'>){return filters.direction??defaultSortDirection(filters.sort);}
export function sortBy(filters:Filters,sort:Filters['sort']):Filters{return {...filters,sort,direction:sort===filters.sort?(sortDirection(filters)==='Ascending'?'Descending':'Ascending'):defaultSortDirection(sort)};}
function matchesSearch(record:ProjectRecord,terms:string[]){
  if(!terms.length)return true;
  const text=[record.id,record.title,record.type,record.customTypeId??'',record.body,...record.tags].join(' ').toLowerCase();
  return terms.every(term=>text.includes(term));
}
export function selectRecords(records:ProjectRecord[],filters:Filters){
  const query=filters.search.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const direction=sortDirection(filters)==='Ascending'?1:-1;
  return records.filter(r=>
    (filters.type==='All records'||r.type===filters.type)&&
    (!filters.entityType||r.customTypeId===filters.entityType)&&
    (filters.status==='Any status'||r.status===filters.status)&&
    (filters.priority==='Any priority'||r.priority===filters.priority)&&
    matchesSearch(r,query)
  ).sort((a,b)=>{
    if(filters.sort==='Created'||filters.sort==='Last edited'){
      const key=filters.sort==='Created'?'createdAt':'updatedAt';
      const left=a[key],right=b[key];
      // Unknown dates sort last in either direction. Stable ties remain alphabetical.
      if(!!left!==!!right)return left?-1:1;
      if(left&&right){const difference=Date.parse(left)-Date.parse(right);if(difference)return direction*difference;}
      return a.title.localeCompare(b.title)||a.id.localeCompare(b.id);
    }
    const primary=filters.sort==='Priority'?priorities.indexOf(a.priority)-priorities.indexOf(b.priority):filters.sort==='Status'?statuses.indexOf(a.status)-statuses.indexOf(b.status):filters.sort==='Type'?a.type.localeCompare(b.type):filters.sort==='ID'?a.id.localeCompare(b.id):a.title.localeCompare(b.title);
    return direction*primary||a.title.localeCompare(b.title)||a.id.localeCompare(b.id);
  });
}
// Keep the existing projection import path available.
export { relationshipsFor } from './relationships';

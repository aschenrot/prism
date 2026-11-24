import { z } from 'zod';
import { idSchema, priorities, statuses, types, type ProjectRecord } from './records';
export const modes = ['Board','Table','Gallery','Slides','Wiki','Relationships'] as const;
export const filtersSchema=z.object({
  type:z.enum(['All records',...types]),
  status:z.enum(['Any status',...statuses]),
  priority:z.enum(['Any priority',...priorities]),
  search:z.string().max(300),
  sort:z.enum(['Title','Priority','Status'])
}).strict();
export const viewInputSchema=z.object({title:z.string().trim().min(1).max(80),mode:z.enum(modes),filters:filtersSchema}).strict();
export const viewSchema=viewInputSchema.extend({id:idSchema,version:z.literal(1)}).strict();
export type Filters=z.infer<typeof filtersSchema>;
export type ViewInput=z.infer<typeof viewInputSchema>;
export type ViewDefinition=z.infer<typeof viewSchema>;
export type SavedView=ViewDefinition & {revision:string};
export type ViewList={views:SavedView[];errors:{file:string;message:string}[]};
export const defaultFilters:Filters={type:'All records',status:'Any status',priority:'Any priority',search:'',sort:'Title'};
export function selectRecords(records:ProjectRecord[],filters:Filters){
  const query=filters.search.trim().toLowerCase();
  const rank={High:0,Normal:1,Low:2};
  return records.filter(r=>
    (filters.type==='All records'||r.type===filters.type)&&
    (filters.status==='Any status'||r.status===filters.status)&&
    (filters.priority==='Any priority'||r.priority===filters.priority)&&
    (!query||[r.id,r.title,r.type,r.body,...r.tags].join(' ').toLowerCase().includes(query))
  ).sort((a,b)=>(filters.sort==='Priority'?rank[a.priority]-rank[b.priority]:filters.sort==='Status'?statuses.indexOf(a.status)-statuses.indexOf(b.status):0)||a.title.localeCompare(b.title)||a.id.localeCompare(b.id));
}
// Keep the existing projection import path available.
export { relationshipsFor } from './relationships';

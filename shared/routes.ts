import { z } from 'zod';
import { idSchema,type ProjectRecord } from './records';
import { filtersSchema,type SavedView } from './views';
import { tableColumnsSchema } from './tableColumns';
import { modeOrder,navigationFor,navigationForSaved,type Destination,type NavigationState } from './navigation';

export type WorkspaceRoute=
  | {projectId:string;kind:'collection';destinationId:string}
  | {projectId:string;kind:'record';recordId:string}
  | {projectId:string;kind:'saved';savedId:string};
export const collectionRoute=(projectId:string,destinationId='overview'):WorkspaceRoute=>({projectId,kind:'collection',destinationId});
export const recordRoute=(projectId:string,recordId:string):WorkspaceRoute=>({projectId,kind:'record',recordId});
export const savedRoute=(projectId:string,savedId:string):WorkspaceRoute=>({projectId,kind:'saved',savedId});
export function routeHash(route:WorkspaceRoute):string{
  const prefix='#/projects/'+encodeURIComponent(route.projectId)+'/';
  return prefix+(route.kind==='record'?'records/'+encodeURIComponent(route.recordId):route.kind==='saved'?'saved/'+encodeURIComponent(route.savedId):encodeURIComponent(route.destinationId));
}
export function parseRoute(hash:string):WorkspaceRoute|null{
  try{
    const parts=hash.slice(2).split('/').map(decodeURIComponent);
    if(!hash.startsWith('#/')||parts[0]!=='projects'||!idSchema.safeParse(parts[1]).success)return null;
    const projectId=parts[1];
    if(parts.length===3&&idSchema.safeParse(parts[2]).success&&parts[2]!=='records'&&parts[2]!=='saved')return collectionRoute(projectId,parts[2]);
    if(parts.length===4&&idSchema.safeParse(parts[3]).success){
      if(parts[2]==='records')return recordRoute(projectId,parts[3]);
      if(parts[2]==='saved')return savedRoute(projectId,parts[3]);
    }
    return null;
  }catch{return null;}
}
// Identity follows the stable record ID, not its editable title or type.
export function parentDestination(destinations:Destination[],record:ProjectRecord|undefined):Destination{
  return destinations.find(d=>record&&d.type===record.type)||destinations.find(d=>d.id==='library')||destinations[0];
}
export const collectionContextSchema=z.strictObject({
  mode:z.enum(modeOrder),
  filters:filtersSchema,
  tableColumns:tableColumnsSchema.optional(),
  focus:idSchema.optional(),
  slide:z.number().int().min(0).max(1000000).optional()
});
export type CollectionContext=z.infer<typeof collectionContextSchema>;
export function contextFor(navigation:NavigationState):CollectionContext{return {mode:navigation.view,filters:navigation.filters,...(navigation.tableColumns!==undefined?{tableColumns:navigation.tableColumns}:{})};}
export function restoreCollection(destination:Destination,preferred:unknown,context:unknown,saved?:SavedView):NavigationState{
  const initial=saved?navigationForSaved(saved):navigationFor(destination,preferred);
  const parsed=collectionContextSchema.safeParse(context);
  if(!parsed.success||!destination.modes.includes(parsed.data.mode))return initial;
  const filters=parsed.data.filters;
  if(destination.id!=='library'&&filters.type!==destination.type)return initial;
  return {...initial,view:parsed.data.mode,filters,tableColumns:parsed.data.tableColumns};
}
export const historyEntrySchema=z.strictObject({
  version:z.literal(1),
  trail:z.string().regex(/^[a-z0-9-]{1,80}$/),
  index:z.number().int().min(0).max(1000000),
  hash:z.string().max(500),
  scroll:z.number().finite().min(0).max(100000000),
  context:collectionContextSchema.optional()
});
export type HistoryEntry=z.infer<typeof historyEntrySchema>;
export function guardedTraversal(previous:HistoryEntry,next:HistoryEntry|null):{kind:'same'}|{kind:'return';delta:number}|{kind:'restore'}{
  if(next&&next.trail===previous.trail){
    if(next.index===previous.index&&next.hash===previous.hash)return {kind:'same'};
    if(next.index!==previous.index)return {kind:'return',delta:previous.index-next.index};
  }
  return {kind:'restore'};
}
export function checkedEntry(state:unknown,hash:string):HistoryEntry|null{
  const parsed=historyEntrySchema.safeParse(state);
  return parsed.success&&parsed.data.hash===hash?parsed.data:null;
}

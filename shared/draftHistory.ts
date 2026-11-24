import type { EditorDraft } from './editor';
type Entry={session:EditorDraft;size:number};
export type DraftHistory={past:Entry[];future:Entry[];group?:{key:string;at:number}};
export const emptyDraftHistory=():DraftHistory=>({past:[],future:[]});
const MAX_ENTRIES=40,MAX_CHARS=4_000_000,GROUP_MS=750;
function entry(session:EditorDraft):Entry{return {session,size:JSON.stringify(session).length};}
function bounded(entries:Entry[]):Entry[]{
 let size=0;const result:Entry[]=[];
 for(let i=entries.length-1;i>=0&&result.length<MAX_ENTRIES;i--){size+=entries[i].size;if(size>MAX_CHARS)break;result.unshift(entries[i]);}
 return result;
}
export function endDraftGroup(history:DraftHistory):DraftHistory{return history.group?{...history,group:undefined}:history;}
export function recordDraftEdit(history:DraftHistory,before:EditorDraft,after:EditorDraft,key:string|undefined,at:number):DraftHistory{
 if(before.baseRevision!==after.baseRevision)return emptyDraftHistory();
 if(before.schemaRevision===after.schemaRevision&&JSON.stringify(before.draft)===JSON.stringify(after.draft))return history;
 const group=key?{key,at}:undefined;
 const combine=!!key&&history.group?.key===key&&at>=history.group.at&&at-history.group.at<=GROUP_MS&&!history.future.length&&history.past.length>0;
 return {past:combine?history.past:bounded([...history.past,entry(before)]),future:[],group};
}
export function stepDraftHistory(history:DraftHistory,current:EditorDraft,direction:'undo'|'redo',updatedAt:string):{history:DraftHistory;session:EditorDraft}|null{
 const source=direction==='undo'?history.past:history.future,last=source.at(-1);
 if(!last||last.session.baseRevision!==current.baseRevision)return null;
 const session={...last.session,updatedAt};
 return {session,history:direction==='undo'?{past:source.slice(0,-1),future:bounded([...history.future,entry(current)])}:{past:bounded([...history.past,entry(current)]),future:source.slice(0,-1)}};
}

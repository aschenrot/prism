import { editorDraftSchema,type EditorDraft } from '../shared/editor';
import { idSchema } from '../shared/records';
type StorageAccess=Pick<Storage,'getItem'|'setItem'|'removeItem'>&Partial<Pick<Storage,'length'|'key'>>;
export type DraftInventory={ids:string[];state:'available'|'incomplete'|'unavailable'};
export type DraftRead=
  | {state:'empty';token:null}
  | {state:'available';token:string;draft:EditorDraft}
  | {state:'invalid';token:string}
  | {state:'unavailable';token:null};
export type DraftWrite={state:'stored';token:string|null}|{state:'conflict'|'unavailable';message:string};
const LIMIT=8_000_000;
export function createDraftStorage(storage:()=>StorageAccess){
  const key=(project:string,id:string)=>'prism:editor-draft:v1:'+encodeURIComponent(project)+':'+encodeURIComponent(id);
  function read(project:string,id:string):DraftRead{
    let raw:string|null;
    try{raw=storage().getItem(key(project,id));}catch{return {state:'unavailable',token:null};}
    if(raw===null)return {state:'empty',token:null};
    try{
      if(raw.length>LIMIT)return {state:'invalid',token:raw};
      const parsed=editorDraftSchema.safeParse(JSON.parse(raw));
      return parsed.success?{state:'available',token:raw,draft:parsed.data}:{state:'invalid',token:raw};
    }catch{return {state:'invalid',token:raw};}
  }
  // Compare the last observed local draft before replacing/removing it. This catches
  // ordinary competing-tab edits, not an atomic cross-process transaction.
  function write(project:string,id:string,expected:string|null,value:EditorDraft|null):DraftWrite{
    try{
      const store=storage(),k=key(project,id);
      if(store.getItem(k)!==expected)return {state:'conflict',message:'Recovery data changed in another window. Your current edits are still in this editor.'};
      const raw=value===null?null:JSON.stringify(value);
      if(raw!==null&&raw.length>LIMIT)return {state:'unavailable',message:'Draft exceeds the local recovery size limit.'};
      if(raw===null)store.removeItem(k);else store.setItem(k,raw);
      return {state:'stored',token:raw};
    }catch{return {state:'unavailable',message:'Browser recovery storage is unavailable or full. Keep this editor open or export a copy.'};}
  }
  function list(project:string):DraftInventory{
    try{
      const store=storage(),prefix=key(project,'');
      if(typeof store.length!=='number'||typeof store.key!=='function')return {ids:[],state:'unavailable'};
      const ids=new Set<string>(),count=store.length,limit=Math.min(count,10000);
      for(let i=0;i<limit;i++){const k=store.key(i);if(k?.startsWith(prefix)){const id=k.slice(prefix.length);if(idSchema.safeParse(id).success)ids.add(id);}}
      return {ids:[...ids].sort(),state:count>limit||store.length!==count?'incomplete':'available'};
    }catch{return {ids:[],state:'unavailable'};}
  }
  return {read,write,list};
}
export const draftStorage=createDraftStorage(()=>window.localStorage);

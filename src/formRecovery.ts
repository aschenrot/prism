import {z} from 'zod';
type Access=Pick<Storage,'getItem'|'setItem'|'removeItem'>;
export type FormRead<T>={state:'empty'|'unavailable';token:null}|{state:'invalid';token:string}|{state:'available';token:string;value:T};
export type FormWrite={state:'stored';token:string|null}|{state:'conflict'|'unavailable';message:string};
const LIMIT=2_000_000;
export function createFormRecovery<T>(access:()=>Access,project:string,kind:string,codec:z.ZodType<T>){
 const key='prism:definition-draft:v1:'+encodeURIComponent(project)+':'+encodeURIComponent(kind);
 const envelope=z.strictObject({version:z.literal(1),value:codec});
 function read():FormRead<T>{
  let raw:string|null;try{raw=access().getItem(key);}catch{return {state:'unavailable',token:null};}
  if(raw===null)return {state:'empty',token:null};
  try{if(raw.length>LIMIT)return {state:'invalid',token:raw};const parsed=envelope.safeParse(JSON.parse(raw));return parsed.success?{state:'available',token:raw,value:parsed.data.value}:{state:'invalid',token:raw};}catch{return {state:'invalid',token:raw};}
 }
 function write(expected:string|null,value:T|null):FormWrite{
  try{
   const store=access();if(store.getItem(key)!==expected)return {state:'conflict',message:'A recovery copy changed in another tab. Your current input is retained; export before closing.'};
   const raw=value===null?null:JSON.stringify({version:1,value});if(raw!==null&&(raw.length>LIMIT||!envelope.safeParse(JSON.parse(raw)).success))return {state:'unavailable',message:'Input cannot be stored within the recovery format or size limit. Export a copy before closing.'};
   if(raw===null)store.removeItem(key);else store.setItem(key,raw);
   return {state:'stored',token:raw};
  }catch{return {state:'unavailable',message:'Browser recovery is unavailable or full. Export your input before closing.'};}
 }
 return {key,read,write};
}

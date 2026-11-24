import { lstat,readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { parse } from 'yaml';
import { projectPropertySchema,type ProjectSchemaResult } from '../shared/customProperties';
const hash=(value:string|Buffer)=>createHash('sha256').update(value).digest('hex');
export async function readProjectSchema(dataRoot:string):Promise<ProjectSchemaResult>{
 const path=join(dataRoot,'schema.yaml');
 try{
  let stat;
  try{stat=await lstat(path);}catch(error){if((error as NodeJS.ErrnoException).code==='ENOENT')return {state:'available',configured:false,revision:hash('absent-project-schema-v1'),definition:{version:1,fields:[]}};throw error;}
  if(!stat.isFile()||stat.size>131072)return {state:'error',message:'Project schema must be a regular file no larger than 128 KiB.'};
  const raw=await readFile(path);
  if(raw.length>131072)return {state:'error',message:'Project schema exceeds 128 KiB.'};
  const result=projectPropertySchema.safeParse(parse(raw.toString('utf8'),{maxAliasCount:0}));
  return result.success?{state:'available',configured:true,revision:hash(raw),definition:result.data}:{state:'error',message:'Invalid project schema: '+result.error.issues.map(i=>i.path.join('.')+': '+i.message).slice(0,4).join('; ')};
 }catch{return {state:'error',message:'Could not read or parse project schema. Existing record data is unchanged.'};}
}

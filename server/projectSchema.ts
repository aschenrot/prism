import { lstat,readFile,writeFile,rename,unlink,link } from 'node:fs/promises';
import { join } from 'node:path';
import { createHash,randomUUID } from 'node:crypto';
import { parse,stringify } from 'yaml';
import { projectPropertySchema,schemaTransitionIssue,type ProjectSchemaResult,type ProjectPropertySchema } from '../shared/customProperties';
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

// Caller serializes this with record writes. External processes are not lockable;
// compare again immediately before publishing and never overwrite an absent-file race.
export class SchemaWriteConflict extends Error {}
export class SchemaWriteRejected extends Error {}
export async function writeProjectSchema(dataRoot:string,expectedRevision:string,definition:ProjectPropertySchema):Promise<ProjectSchemaResult>{
 const next=projectPropertySchema.parse(definition),current=await readProjectSchema(dataRoot);
 if(current.state!=='available')throw new SchemaWriteRejected('Invalid project schema must be repaired externally. No data was overwritten.');
 if(current.revision!==expectedRevision)throw new SchemaWriteConflict('Project schema changed. Review the current definition before retrying.');
 const issue=schemaTransitionIssue(current.definition,next);if(issue)throw new SchemaWriteRejected(issue);
 if(JSON.stringify(current.definition)===JSON.stringify(next))return current;
 const path=join(dataRoot,'schema.yaml'),tmp=join(dataRoot,'.schema-'+randomUUID()+'.tmp');
 const raw=stringify(next);
 if(Buffer.byteLength(raw)>131072)throw new SchemaWriteRejected('Project schema exceeds 128 KiB.');
 try{
  await writeFile(tmp,raw,{flag:'wx',flush:true});
  const latest=await readProjectSchema(dataRoot);
  if(latest.state!=='available'||latest.revision!==expectedRevision)throw new SchemaWriteConflict('Project schema changed during editing. No schema changes were published.');
  if(current.configured)await rename(tmp,path);
  else{try{await link(tmp,path);}catch(error){if((error as NodeJS.ErrnoException).code==='EEXIST')throw new SchemaWriteConflict('A project schema appeared during editing. Review before retrying.');throw error;}}
 }finally{await unlink(tmp).catch(()=>{});}
 const saved=await readProjectSchema(dataRoot);
 if(saved.state!=='available'||saved.revision!==hash(raw))throw new SchemaWriteConflict('Schema write could not be confirmed. Refresh and inspect the file.');
 return saved;
}

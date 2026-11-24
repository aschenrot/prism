import { lstat,readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { verificationSchema,type VerificationResult } from '../shared/verification';
import { browserVerificationSchema,type BrowserVerificationResult } from '../shared/browserVerification';
export async function readVerification(root:string):Promise<VerificationResult>{
  try{
    let path=root;
    for(const part of ['.prism','cache','verification']){
      path=join(path,part);
      if(!(await lstat(path)).isDirectory())return {state:'error',message:'Verification cache must be a real directory.'};
    }
    path=join(path,'latest.json');
    const stat=await lstat(path);
    if(!stat.isFile()||stat.size>65536)return {state:'error',message:'Invalid verification report file.'};
    const raw=await readFile(path,'utf8');
    if(Buffer.byteLength(raw)>65536)return {state:'error',message:'Verification report exceeds size limit.'};
    const parsed=verificationSchema.safeParse(JSON.parse(raw));
    return parsed.success?{state:'available',report:parsed.data}:{state:'error',message:'Verification report does not match the supported format.'};
  }catch(e){
    if((e as NodeJS.ErrnoException).code==='ENOENT')return {state:'unavailable',message:'No local verification report yet.'};
    return {state:'error',message:'Could not read local verification report.'};
  }
}

export async function readBrowserVerification(root:string):Promise<BrowserVerificationResult>{
 try{
  let path=root;
  for(const part of ['.prism','cache','browser']){path=join(path,part);if(!(await lstat(path)).isDirectory())return {state:'error',message:'Browser cache must be a real directory.'};}
  path=join(path,'latest.json');const stat=await lstat(path);if(!stat.isFile()||stat.size>65536)return {state:'error',message:'Invalid browser verification report file.'};
  const raw=await readFile(path,'utf8');if(Buffer.byteLength(raw)>65536)return {state:'error',message:'Browser verification report exceeds size limit.'};
  const parsed=browserVerificationSchema.safeParse(JSON.parse(raw));return parsed.success?{state:'available',report:parsed.data}:{state:'error',message:'Browser verification report does not match the supported format.'};
 }catch(error){return (error as NodeJS.ErrnoException).code==='ENOENT'?{state:'unavailable',message:'No local browser verification report yet.'}:{state:'error',message:'Could not read local browser verification report.'};}
}

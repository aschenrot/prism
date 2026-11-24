import { githubRepositorySchema,githubRunsSchema,type HostedVerificationResult } from '../shared/hostedVerification';

const MAX_BYTES=1_000_000, CACHE_MS=30_000;
async function boundedJson(response:Response){
 const reader=response.body?.getReader();if(!reader)throw Error('Empty response');
 const decoder=new TextDecoder('utf-8',{fatal:true});let size=0,raw='';
 try{
  for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>MAX_BYTES)throw Error('Response too large');raw+=decoder.decode(value,{stream:true});}
  return JSON.parse(raw+decoder.decode()) as unknown;
 }finally{await reader.cancel().catch(()=>{});reader.releaseLock();}
}
// The request is limited to a fixed GitHub API origin, a validated repository slug,
// an anonymous GET, a bounded page/response and a timeout. Never follow redirects.
export async function readHostedRuns(repository:string,request:typeof fetch=fetch):Promise<HostedVerificationResult>{
 const parsedRepo=githubRepositorySchema.safeParse(repository);
 if(!parsedRepo.success)return {state:'error',message:'Invalid GitHub repository configuration.'};
 try{
  const response=await request('https://api.github.com/repos/'+parsedRepo.data+'/actions/runs?per_page=10',{
   method:'GET',redirect:'error',signal:AbortSignal.timeout(8000),
   headers:{Accept:'application/vnd.github+json','User-Agent':'Prism-Workspace'}
  });
  if(!response.ok){
   await response.body?.cancel().catch(()=>{});
   if(response.status===403||response.status===429)return {state:'unavailable',message:'GitHub access or anonymous rate limit reached. Try again later.'};
   if(response.status===404)return {state:'unavailable',message:'Public GitHub repository or Actions runs not available.'};
   return {state:'error',message:'GitHub returned an unsuccessful response.'};
  }
  const parsed=githubRunsSchema.safeParse(await boundedJson(response));
  if(!parsed.success)return {state:'error',message:'GitHub workflow metadata did not match the supported format.'};
  return {state:'available',repository:parsedRepo.data,observedAt:new Date().toISOString(),total:parsed.data.total_count,runs:parsed.data.workflow_runs.map(run=>({
    id:run.id,name:run.name??'Workflow',branch:run.head_branch,head:run.head_sha,event:run.event,status:run.status,conclusion:run.conclusion,attempt:run.run_attempt,updatedAt:run.updated_at,pullRequests:[...new Set(run.pull_requests.map(p=>p.number))]
  }))};
 }catch{return {state:'error',message:'Could not read public GitHub workflow metadata.'};}
}
// The configured registry is bounded to 40 projects. Coalesce reads and throttle
// repeated refreshes per exact configured slug; no disk writes or polling.
const cache=new Map<string,{until:number;result:HostedVerificationResult}>();
const pending=new Map<string,Promise<HostedVerificationResult>>();
export function hostedRuns(repository:string):Promise<HostedVerificationResult>{
 const previous=cache.get(repository);if(previous&&previous.until>Date.now())return Promise.resolve(previous.result);
 const existing=pending.get(repository);if(existing)return existing;
 const task=readHostedRuns(repository).then(result=>{cache.set(repository,{until:Date.now()+CACHE_MS,result});return result;}).finally(()=>pending.delete(repository));
 pending.set(repository,task);return task;
}

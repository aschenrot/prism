import { githubRepositorySchema,githubRunsSchema,githubPullSchema,githubJobsSchema,githubIdSchema,type HostedVerificationResult,type HostedPullResult,type HostedJobsResult,type HostedDetailError } from '../shared/hostedVerification';

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
  if(!parsed.success||parsed.data.workflow_runs.some(run=>run.repository.full_name.toLowerCase()!==repository.toLowerCase()))return {state:'error',message:'GitHub workflow metadata did not match the configured repository or supported format.'};
  return {state:'available',repository:parsedRepo.data,observedAt:new Date().toISOString(),total:parsed.data.total_count,runs:parsed.data.workflow_runs.map(run=>({
    id:run.id,name:run.name??'Workflow',branch:run.head_branch,head:run.head_sha,event:run.event,status:run.status,conclusion:run.conclusion,attempt:run.run_attempt,updatedAt:run.updated_at,pullRequests:[...new Set(run.pull_requests.filter(p=>p.base?.repo.id===run.repository.id).map(p=>p.number))]
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

// Separate bounded lookups for explicit references and selected run attempts.
// The API does not attest the actual checkout SHA or completeness of test coverage.
async function publicDetail(repository:string,path:string,request:typeof fetch):Promise<{state:'available';value:unknown}|HostedDetailError>{
 try{
  const response=await request('https://api.github.com/repos/'+githubRepositorySchema.parse(repository)+path,{method:'GET',redirect:'error',signal:AbortSignal.timeout(8000),headers:{Accept:'application/vnd.github+json','User-Agent':'Prism-Workspace'}});
  if(!response.ok){await response.body?.cancel().catch(()=>{});return {state:response.status===403||response.status===429||response.status===404?'unavailable':'error',message:response.status===403||response.status===429?'GitHub access or anonymous rate limit reached. Try again later.':response.status===404?'Public GitHub evidence not available.':'GitHub returned an unsuccessful response.'};}
  return {state:'available',value:await boundedJson(response)};
 }catch{return {state:'error',message:'Could not read public GitHub evidence.'};}
}
export async function readHostedPull(repository:string,number:number,request:typeof fetch=fetch):Promise<HostedPullResult>{
 if(!githubRepositorySchema.safeParse(repository).success||!githubIdSchema.safeParse(number).success)return {state:'error',message:'Invalid pull request reference.'};
 const result=await publicDetail(repository,'/pulls/'+number,request);if(result.state!=='available')return result;
 const parsed=githubPullSchema.safeParse(result.value);
 if(!parsed.success||parsed.data.number!==number||parsed.data.base.repo.full_name.toLowerCase()!==repository.toLowerCase())return {state:'error',message:'GitHub pull request metadata did not match the reference.'};
 const p=parsed.data;return {state:'available',repository,observedAt:new Date().toISOString(),pull:{number:p.number,title:p.title,state:p.state,draft:p.draft,merged:p.merged,head:p.head.sha,base:p.base.sha,reportedMerge:p.merge_commit_sha,updatedAt:p.updated_at}};
}
export async function readHostedJobs(repository:string,runId:number,attempt:number,request:typeof fetch=fetch):Promise<HostedJobsResult>{
 if(!githubRepositorySchema.safeParse(repository).success||!githubIdSchema.safeParse(runId).success||!githubIdSchema.safeParse(attempt).success)return {state:'error',message:'Invalid workflow run reference.'};
 const result=await publicDetail(repository,'/actions/runs/'+runId+'/attempts/'+attempt+'/jobs?per_page=50',request);if(result.state!=='available')return result;
 const parsed=githubJobsSchema.safeParse(result.value);
 if(!parsed.success||parsed.data.jobs.some(job=>job.run_id!==runId||job.run_attempt!==attempt)||new Set(parsed.data.jobs.map(job=>job.id)).size!==parsed.data.jobs.length||parsed.data.total_count<parsed.data.jobs.length)return {state:'error',message:'GitHub job metadata did not match the selected run attempt.'};
 return {state:'available',repository,observedAt:new Date().toISOString(),runId,attempt,total:parsed.data.total_count,jobs:parsed.data.jobs.map(job=>({id:job.id,name:job.name,status:job.status,conclusion:job.conclusion,reportedHead:job.head_sha,startedAt:job.started_at,completedAt:job.completed_at}))};
}
// Bound both completed entries and concurrent requests, even if a local client
// supplies many distinct numeric IDs. No remote fetch on ordinary record reads.
type Detail=HostedPullResult|HostedJobsResult;
const details=new Map<string,{until:number;result:Detail}>(),detailPending=new Map<string,Promise<Detail>>();
async function cachedDetail<T extends Detail>(key:string,load:()=>Promise<T>):Promise<T|HostedDetailError>{
 const previous=details.get(key);if(previous&&previous.until>Date.now())return previous.result as T;
 const existing=detailPending.get(key);if(existing)return existing as Promise<T>;
 if(detailPending.size>=8)return {state:'unavailable',message:'Too many evidence requests in progress. Try again.'};
 const task=load().then(result=>{details.delete(key);details.set(key,{until:Date.now()+CACHE_MS,result});if(details.size>80)details.delete(details.keys().next().value!);return result;}).finally(()=>detailPending.delete(key));
 detailPending.set(key,task);return task;
}
export const hostedPull=(repository:string,number:number)=>cachedDetail('pull:'+repository+':'+number,()=>readHostedPull(repository,number));
export const hostedJobs=(repository:string,runId:number,attempt:number)=>cachedDetail('jobs:'+repository+':'+runId+':'+attempt,()=>readHostedJobs(repository,runId,attempt));

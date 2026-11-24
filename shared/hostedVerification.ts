import { z } from 'zod';

// Registry configuration, not a user-supplied URL. No hosts, credentials or traversal.
export const githubRepositorySchema=z.string().regex(/^[A-Za-z0-9][A-Za-z0-9-]{0,38}\/[A-Za-z0-9_][A-Za-z0-9_.-]{0,99}$/);
const revision=z.string().regex(/^[a-f0-9]{40}$/);
const label=z.string().min(1).max(120);
const providerRun=z.object({
 id:z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
 name:label.nullable().optional(),
 head_branch:label.nullable(),
 head_sha:revision,
 event:label,
 status:label,
 conclusion:label.nullable(),
 run_attempt:z.number().int().positive(),
 updated_at:z.iso.datetime({offset:true}),
 repository:z.object({id:z.number().int().positive().max(Number.MAX_SAFE_INTEGER),full_name:githubRepositorySchema}),
 pull_requests:z.array(z.object({number:z.number().int().positive().max(Number.MAX_SAFE_INTEGER),base:z.object({repo:z.object({id:z.number().int().positive().max(Number.MAX_SAFE_INTEGER)})}).nullable().optional()})).max(100)
});
export const githubRunsSchema=z.object({total_count:z.number().int().nonnegative(),workflow_runs:z.array(providerRun).max(10)});
export type HostedRun={id:number;name:string;branch:string|null;head:string;event:string;status:string;conclusion:string|null;attempt:number;updatedAt:string;pullRequests:number[]};
export type HostedVerificationResult=
 | {state:'available';repository:string;observedAt:string;total:number;runs:HostedRun[]}
 | {state:'unavailable'|'error';message:string};
export function hostedRunOutcome(run:Pick<HostedRun,'status'|'conclusion'>){
 if(run.status!=='completed')return 'pending';
 return run.conclusion==='success'?'passed':'not-passed';
}
export function hostedRevisionRelation(run:Pick<HostedRun,'head'|'event'>,head:string|undefined){
 if(!head)return 'unknown';
 if(run.head!==head)return 'different';
 // A PR head is not necessarily the checked-out synthetic merge revision.
 return run.event==='pull_request'||run.event==='pull_request_target'?'pr-head':'reported-head';
}
export function hostedRunUrl(repository:string,id:number){
 return 'https://github.com/'+githubRepositorySchema.parse(repository)+'/actions/runs/'+String(z.number().int().positive().max(Number.MAX_SAFE_INTEGER).parse(id));
}

// Explicit authored references are repository-qualified, never inferred from branch names.
export const githubIdSchema=z.number().int().positive().max(Number.MAX_SAFE_INTEGER);
export const pullReferenceSchema=z.strictObject({repository:githubRepositorySchema,number:githubIdSchema});
export const pullReferencesSchema=z.array(pullReferenceSchema).max(5).refine(refs=>new Set(refs.map(ref=>ref.repository.toLowerCase()+':'+ref.number)).size===refs.length,'Duplicate pull request reference');
export type PullReference=z.infer<typeof pullReferenceSchema>;
export function matchingPullRuns(reference:PullReference,repository:string,runs:HostedRun[]){
 if(reference.repository.toLowerCase()!==repository.toLowerCase())return [];
 return runs.filter(run=>run.event==='pull_request'&&run.pullRequests.includes(reference.number));
}
export function pullRequestUrl(reference:PullReference){
 const ref=pullReferenceSchema.parse(reference);return 'https://github.com/'+ref.repository+'/pull/'+ref.number;
}
export const githubPullSchema=z.object({
 number:githubIdSchema,title:z.string().min(1).max(500),state:z.enum(['open','closed']),draft:z.boolean(),merged:z.boolean(),
 head:z.object({sha:revision}),base:z.object({sha:revision,repo:z.object({full_name:githubRepositorySchema})}),
 merge_commit_sha:revision.nullable(),updated_at:z.iso.datetime({offset:true})
});
export const githubJobsSchema=z.object({total_count:z.number().int().nonnegative(),jobs:z.array(z.object({
 id:githubIdSchema,run_id:githubIdSchema,run_attempt:githubIdSchema,head_sha:revision,name:z.string().min(1).max(300),status:label,conclusion:label.nullable(),
 started_at:z.iso.datetime({offset:true}).nullable(),completed_at:z.iso.datetime({offset:true}).nullable()
})).max(50)});
export type HostedPull={number:number;title:string;state:'open'|'closed';draft:boolean;merged:boolean;head:string;base:string;reportedMerge:string|null;updatedAt:string};
export type HostedJob={id:number;name:string;status:string;conclusion:string|null;reportedHead:string;startedAt:string|null;completedAt:string|null};
export type HostedDetailError={state:'unavailable'|'error';message:string};
export type HostedPullResult={state:'available';repository:string;observedAt:string;pull:HostedPull}|HostedDetailError;
export type HostedJobsResult={state:'available';repository:string;observedAt:string;runId:number;attempt:number;total:number;jobs:HostedJob[]}|HostedDetailError;

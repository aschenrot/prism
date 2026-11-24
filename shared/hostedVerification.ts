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
 pull_requests:z.array(z.object({number:z.number().int().positive().max(Number.MAX_SAFE_INTEGER)})).max(100)
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

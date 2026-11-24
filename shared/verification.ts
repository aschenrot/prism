import { z } from 'zod';
const sha=z.string().regex(/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/);
export const verificationSteps=['install','typecheck','test','build','audit','audit-production'] as const;
const timestamp=z.string().max(40).refine(v=>Number.isFinite(Date.parse(v)),'Invalid timestamp');
export const verificationSchema=z.strictObject({
  version:z.literal(1),source:z.literal('local-npm'),startedAt:timestamp,finishedAt:timestamp,
  revision:sha,endingRevision:sha.nullable(),cleanAtStart:z.boolean(),cleanAtEnd:z.boolean(),
  environment:z.strictObject({platform:z.string().max(40),arch:z.string().max(40),node:z.string().max(40),npm:z.string().max(40)}),
  steps:z.array(z.strictObject({id:z.enum(verificationSteps),status:z.enum(['passed','failed','skipped']),exitCode:z.number().int().nullable(),durationMs:z.number().int().nonnegative()})).length(verificationSteps.length)
}).superRefine((r,ctx)=>{
  if(new Set(r.steps.map(s=>s.id)).size!==verificationSteps.length)ctx.addIssue({code:'custom',message:'Each required check must appear exactly once'});
  if(Date.parse(r.finishedAt)<Date.parse(r.startedAt))ctx.addIssue({code:'custom',message:'Invalid report time range'});
  for(const s of r.steps)if((s.status==='passed'&&s.exitCode!==0)||(s.status==='failed'&&s.exitCode===0)||(s.status==='skipped'&&s.exitCode!==null))ctx.addIssue({code:'custom',message:'Inconsistent check result'});
});
export type VerificationReport=z.infer<typeof verificationSchema>;
export type VerificationResult={state:'available';report:VerificationReport}|{state:'unavailable'|'error';message:string};
export function verificationState(report:VerificationReport,head:string|undefined){
  if(!report.cleanAtStart||!report.cleanAtEnd||report.endingRevision!==report.revision)return 'diagnostic' as const;
  if(!head)return 'unknown' as const;
  if(head!==report.revision)return 'historical' as const;
  return report.steps.every(s=>s.status==='passed')?'passed' as const:'not-passed' as const;
}

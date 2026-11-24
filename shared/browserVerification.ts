import { z } from 'zod';
const sha=z.string().regex(/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/);
const stamp=z.iso.datetime({offset:true});
const count=z.number().int().nonnegative();
const word=z.string().min(1).max(80);
export const browserVerificationSchema=z.strictObject({
 version:z.literal(1),source:z.literal('local-playwright'),revision:sha,endingRevision:sha.nullable(),
 cleanAtStart:z.boolean(),cleanAtEnd:z.boolean(),startedAt:stamp,finishedAt:stamp,
 environment:z.strictObject({platform:word,arch:word,node:word,playwright:word,browser:word}),
 buildExitCode:z.number().int().nullable(),browserExitCode:z.number().int().nullable(),
 stats:z.strictObject({passed:count,failed:count,flaky:count,skipped:count}).nullable(),
 minimumScenarios:z.number().int().positive(),eligible:z.boolean(),reportDirectory:z.uuid()
}).superRefine((report,ctx)=>{
 if(Date.parse(report.finishedAt)<Date.parse(report.startedAt))ctx.addIssue({code:'custom',message:'Invalid browser report time range'});
 if(report.eligible&&!browserReportPassed(report))ctx.addIssue({code:'custom',message:'Inconsistent eligible browser report'});
});
type BrowserGateFields={revision:string;endingRevision:string|null;cleanAtStart:boolean;cleanAtEnd:boolean;buildExitCode:number|null;browserExitCode:number|null;stats:{passed:number;failed:number;flaky:number;skipped:number}|null;minimumScenarios:number};
function browserReportPassed(report:BrowserGateFields){
 const stats=report.stats;
 return report.cleanAtStart&&report.cleanAtEnd&&report.endingRevision===report.revision&&report.buildExitCode===0&&report.browserExitCode===0&&!!stats&&stats.passed>=report.minimumScenarios&&!stats.failed&&!stats.flaky&&!stats.skipped;
}
export type BrowserVerificationReport=z.infer<typeof browserVerificationSchema>;
export type BrowserVerificationResult={state:'available';report:BrowserVerificationReport}|{state:'unavailable'|'error';message:string};
export function browserVerificationState(report:BrowserVerificationReport,head:string|undefined){
 if(!report.cleanAtStart||!report.cleanAtEnd||report.endingRevision!==report.revision)return 'diagnostic' as const;
 if(!head)return 'unknown' as const;
 if(head!==report.revision)return 'historical' as const;
 return report.eligible&&browserReportPassed(report)?'passed' as const:'not-passed' as const;
}

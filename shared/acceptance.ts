import { z } from 'zod';
import { idSchema,type ProjectRecord } from './records';
import { verificationSchema } from './verification';

export const gitRevisionSchema=z.string().regex(/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/);
export const contentRevisionSchema=z.string().regex(/^[a-f0-9]{64}$/);
const timestamp=z.string().max(40).refine(v=>Number.isFinite(Date.parse(v)),'Invalid timestamp');
const caseId=z.string().regex(/^[A-Z][0-9]{2,4}$/);
export const acceptanceOutcomes=['Pending','Passed','Failed','Blocked'] as const;
export const acceptanceOutcomeSchema=z.enum(acceptanceOutcomes);
export type AcceptanceOutcome=z.infer<typeof acceptanceOutcomeSchema>;
const caseSchema=z.strictObject({id:caseId,title:z.string().min(1).max(160),action:z.string().min(1).max(6000),expected:z.string().min(1).max(6000)});
const groupSchema=z.strictObject({id:z.string().regex(/^[A-Z]$/),title:z.string().min(1).max(160),setup:z.string().max(12000),cases:z.array(caseSchema).min(1).max(100)});
export const acceptanceDefinitionSchema=z.strictObject({instructions:z.string().max(30000),groups:z.array(groupSchema).min(1).max(26)}).superRefine((d,ctx)=>{
  const ids=d.groups.flatMap(g=>g.cases.map(c=>c.id));
  if(ids.length>100||new Set(ids).size!==ids.length||new Set(d.groups.map(g=>g.id)).size!==d.groups.length||d.groups.some(g=>g.cases.some(c=>!c.id.startsWith(g.id))))ctx.addIssue({code:'custom',message:'Acceptance groups and case IDs must be unique and consistent (maximum 100 cases)'});
  if(JSON.stringify(d).length>160000)ctx.addIssue({code:'custom',message:'Acceptance definition exceeds size limit'});
});
export type AcceptanceDefinition=z.infer<typeof acceptanceDefinitionSchema>;
export type AcceptanceCase=z.infer<typeof caseSchema>;
export function isAcceptanceTest(record:ProjectRecord){return record.type==='Test'&&record.tags.some(t=>t.toLowerCase()==='acceptance');}
export type DefinitionResult={state:'available';definition:AcceptanceDefinition}|{state:'invalid';message:string}|{state:'unsupported'};
/** Explicit, bounded Markdown convention for acceptance-tagged Test records only.
 * Source remains canonical. Legacy checkmarks are never imported as execution evidence.
 */
export function acceptanceDefinition(record:ProjectRecord):DefinitionResult{
  if(!isAcceptanceTest(record))return {state:'unsupported'};
  const groups:z.infer<typeof groupSchema>[]=[];
  const intro:string[]=[];
  let group:z.infer<typeof groupSchema>|undefined;
  let finished=false;
  for(const raw of record.body.split(/\r?\n/)){
    const line=raw.trim();
    if(finished)continue;
    if(/^## Results\s*$/.test(line)){finished=true;continue;}
    const heading=/^## ([A-Z])\. (.+)$/.exec(line);
    if(heading){group={id:heading[1],title:heading[2],setup:'',cases:[]};groups.push(group);continue;}
    if(!group){if(line!=='## Review instructions')intro.push(raw);continue;}
    const item=/^- \[[ xX]\] ([A-Z][0-9]{2,4}) — \*\*(.+?)\*\* — (.+?) Expected: (.+)$/.exec(line);
    if(item){group.cases.push({id:item[1],title:item[2],action:item[3],expected:item[4]});continue;}
    if(!line)continue;
    if(group.cases.length||/^[-*]\s+\[/.test(line)||/^## /.test(line))return {state:'invalid',message:'Invalid acceptance case in group '+group.id+'. Use a unique case ID, bold title, action and Expected: result.'};
    group.setup+=(group.setup?'\n':'')+raw;
  }
  const result=acceptanceDefinitionSchema.safeParse({instructions:intro.join('\n').trim(),groups});
  return result.success?{state:'available',definition:result.data}:{state:'invalid',message:'Invalid acceptance definition: '+result.error.issues[0]?.message};
}
export const acceptanceResultSchema=z.strictObject({caseId,outcome:acceptanceOutcomeSchema,notes:z.string().max(4000),recordedAt:timestamp});
export const acceptanceRunSchema=z.strictObject({
  version:z.literal(1),id:idSchema,testId:idSchema,testTitle:z.string().min(1).max(160),definitionRevision:contentRevisionSchema,
  testedRevision:gitRevisionSchema,definition:acceptanceDefinitionSchema,
  reviewer:z.string().trim().min(1).max(120),environment:z.string().trim().min(1).max(500),
  startedAt:timestamp,updatedAt:timestamp,results:z.array(acceptanceResultSchema).max(100),
  decision:z.enum(['open','accepted','changes-requested']),decisionNotes:z.string().max(4000),
  verification:verificationSchema.nullable()
}).superRefine((run,ctx)=>{
  const ids=new Set(run.definition.groups.flatMap(g=>g.cases.map(c=>c.id)));
  if(new Set(run.results.map(r=>r.caseId)).size!==run.results.length||run.results.some(r=>!ids.has(r.caseId)))ctx.addIssue({code:'custom',message:'Unknown or duplicate result case'});
  if(run.results.some(r=>(r.outcome==='Failed'||r.outcome==='Blocked')&&!r.notes.trim()))ctx.addIssue({code:'custom',message:'Failed and blocked cases require observations'});
  if(run.verification&&run.verification.revision!==run.testedRevision)ctx.addIssue({code:'custom',message:'Verification belongs to another revision'});
  if(run.decision!=='open'&&!run.decisionNotes.trim())ctx.addIssue({code:'custom',message:'Review decision requires notes'});
  if(run.decision==='accepted'&&(![...ids].every(id=>run.results.some(r=>r.caseId===id&&r.outcome==='Passed'))))ctx.addIssue({code:'custom',message:'Every required case must pass before acceptance'});
});
export type AcceptanceRunData=z.infer<typeof acceptanceRunSchema>;
export type AcceptanceRun=AcceptanceRunData&{revision:string};
export function acceptanceProgress(run:Pick<AcceptanceRunData,'definition'|'results'>){
  const cases=run.definition.groups.flatMap(g=>g.cases);
  const count=(outcome:AcceptanceOutcome)=>cases.filter(c=>run.results.find(r=>r.caseId===c.id)?.outcome===outcome).length;
  const passed=count('Passed'),failed=count('Failed'),blocked=count('Blocked');
  return {total:cases.length,passed,failed,blocked,pending:cases.length-passed-failed-blocked};
}
export function acceptanceSummary(run:AcceptanceRun){
  const {id,testId,definitionRevision,testedRevision,reviewer,environment,startedAt,updatedAt,decision}=run;
  return {id,testId,definitionRevision,testedRevision,reviewer,environment,startedAt,updatedAt,decision,progress:acceptanceProgress(run)};
}
export type AcceptanceSummary=ReturnType<typeof acceptanceSummary>;
export type AcceptanceList={runs:AcceptanceSummary[];errors:{file:string;message:string}[]};
export const startAcceptanceSchema=z.strictObject({expectedDefinitionRevision:contentRevisionSchema,expectedHead:gitRevisionSchema,reviewer:z.string().trim().min(1).max(120),environment:z.string().trim().min(1).max(500)});
export type StartAcceptance=z.infer<typeof startAcceptanceSchema>;
export const updateAcceptanceSchema=z.discriminatedUnion('action',[
  z.strictObject({action:z.literal('case'),expectedRevision:contentRevisionSchema,caseId,outcome:acceptanceOutcomeSchema,notes:z.string().max(4000)}),
  z.strictObject({action:z.literal('decision'),expectedRevision:contentRevisionSchema,decision:z.enum(['accepted','changes-requested']),notes:z.string().trim().min(1).max(4000)})
]);
export type UpdateAcceptance=z.infer<typeof updateAcceptanceSchema>;
export function currentAcceptance(run:Pick<AcceptanceRunData,'testedRevision'|'definitionRevision'>,head:string|undefined,definitionRevision:string|undefined){return !!head&&run.testedRevision===head&&run.definitionRevision===definitionRevision;}
export function applyAcceptanceUpdate(run:AcceptanceRunData,input:UpdateAcceptance,now:string):AcceptanceRunData{
  if(run.decision!=='open')throw new Error('Finalized review cannot be changed');
  if(input.action==='case'){
    const results=run.results.filter(r=>r.caseId!==input.caseId);
    results.push({caseId:input.caseId,outcome:input.outcome,notes:input.notes,recordedAt:now});
    return acceptanceRunSchema.parse({...run,results,updatedAt:now});
  }
  return acceptanceRunSchema.parse({...run,decision:input.decision,decisionNotes:input.notes,updatedAt:now});
}

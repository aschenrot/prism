import { acceptanceProgress,type AcceptanceRunData } from './acceptance';
import { verificationState } from './verification';
// Keep user-provided content literal in a PR comment; no raw HTML or @mentions.
function text(value:string){return value.replace(/[&<>@\\\x60*_~\[\]()#!|]|\r\n?|\n/g,m=>m==='&'?'&amp;':m==='<'?'&lt;':m==='>'?'&gt;':m==='@'?'&#64;':m==='\r'||m==='\n'||m==='\r\n'?' / ':'\\'+m).trim();}
export function reviewSummary(run:AcceptanceRunData){
  const p=acceptanceProgress(run);
  const lines=['## Prism acceptance review','',
    '- Test: '+text(run.testTitle)+' (\x60'+run.testId+'\x60)',
    '- Run: \x60'+run.id+'\x60',
    '- Tested Git revision: \x60'+run.testedRevision+'\x60',
    '- Test definition revision: \x60'+run.definitionRevision+'\x60',
    '- Reviewer: '+text(run.reviewer),
    '- Environment: '+text(run.environment),
    '- Updated: '+run.updatedAt,
    '- Manual decision: '+(run.decision==='open'?'Open':run.decision==='accepted'?'Accepted':'Changes requested'),
    '- Outcomes: '+p.passed+' passed / '+p.failed+' failed / '+p.blocked+' blocked / '+p.pending+' pending ('+p.total+' total)',
    '- Local npm verification: '+(run.verification?verificationState(run.verification,run.testedRevision):'not recorded'),''];
  if(run.verification){const r=run.verification;lines.push('Verification environment: '+text([r.environment.platform,r.environment.arch,r.environment.node,'npm '+r.environment.npm].join(' · '))+'; finished '+r.finishedAt+'.','',...r.steps.map(s=>'- '+s.id+': '+s.status+(s.exitCode===null?'':' (exit '+s.exitCode+')')),'');}
  for(const group of run.definition.groups){lines.push('### '+text(group.title),'');for(const item of group.cases){const result=run.results.find(r=>r.caseId===item.id);lines.push('- '+item.id+' — **'+(result?.outcome||'Pending')+'** — '+text(item.title)+(result?.notes?' — '+text(result.notes):''));}lines.push('');}
  if(run.decisionNotes)lines.push('Decision notes: '+text(run.decisionNotes),'');
  lines.push('Reviewer-recorded evidence only. Browser regression evidence and merge approval are separate; a recorded Git HEAD alone does not attest to continuous working-tree cleanliness.');
  return lines.join('\n')+'\n';
}

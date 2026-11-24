import { createHash,randomUUID } from 'node:crypto';
import { lstat,mkdir,readFile,readdir,writeFile,rename,unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { idSchema,type ProjectRecord } from '../shared/records';
import { acceptanceDefinition,acceptanceRunSchema,acceptanceSummary,applyAcceptanceUpdate,currentAcceptance,startAcceptanceSchema,updateAcceptanceSchema,type AcceptanceRun,type AcceptanceRunData,type AcceptanceList,type StartAcceptance,type UpdateAcceptance } from '../shared/acceptance';
import type { VerificationReport } from '../shared/verification';
import { ConflictError,MissingError } from './store';
const FILE_LIMIT=2_000_000, RUN_LIMIT=100;
type Scope={record:ProjectRecord;head:string;verification:VerificationReport|null};
// Separate per-run local evidence files; never mutate the canonical Test record.
// Like RecordStore, serialization is within one server process, not a distributed lock.
export class AcceptanceStore{
  private queue:Promise<unknown>=Promise.resolve();
  constructor(private root:string,private scope:(testId:string)=>Promise<Scope>){}
  private async directory(create=false){
    if(!(await lstat(this.root)).isDirectory())throw new Error('Invalid project data directory');
    const dir=join(this.root,'acceptance.local');
    if(create)await mkdir(dir).catch(e=>{if((e as NodeJS.ErrnoException).code!=='EEXIST')throw e;});
    try{if(!(await lstat(dir)).isDirectory())throw new Error('Acceptance directory must be a real directory');}
    catch(e){if((e as NodeJS.ErrnoException).code==='ENOENT'&&!create)return null;throw e;}
    return dir;
  }
  private prefix(testId:string){return idSchema.parse(testId)+'.';}
  private filename(testId:string,id:string){return this.prefix(testId)+idSchema.parse(id)+'.json';}
  private async files(testId:string){const dir=await this.directory();return dir?(await readdir(dir)).filter(f=>f.startsWith(this.prefix(testId))&&f.endsWith('.json')).sort():[];}
  private serialize<T>(fn:()=>Promise<T>){const next=this.queue.then(fn,fn);this.queue=next.then(()=>undefined,()=>undefined);return next;}
  async get(testId:string,id:string):Promise<AcceptanceRun>{
    const filename=this.filename(testId,id),dir=await this.directory();
    if(!dir)throw new MissingError('Acceptance run not found');
    let raw:Buffer;
    try{const path=join(dir,filename),stat=await lstat(path);if(!stat.isFile()||stat.size>FILE_LIMIT)throw new Error('Invalid acceptance file');raw=await readFile(path);if(raw.length>FILE_LIMIT)throw new Error('Acceptance file too large');}
    catch(e){if((e as NodeJS.ErrnoException).code==='ENOENT')throw new MissingError('Acceptance run not found');throw e;}
    const data=acceptanceRunSchema.parse(JSON.parse(raw.toString('utf8')));
    if(data.id!==id||data.testId!==testId)throw new Error('Acceptance file identity mismatch');
    return {...data,revision:createHash('sha256').update(raw).digest('hex')};
  }
  async list(testId:string):Promise<AcceptanceList>{
    const files=await this.files(testId);
    if(files.length>RUN_LIMIT)throw new Error('Too many local acceptance runs; archive older files before continuing');
    const runs:AcceptanceList['runs']=[],errors:AcceptanceList['errors']=[];
    for(const file of files)try{runs.push(acceptanceSummary(await this.get(testId,file.slice(this.prefix(testId).length,-5))));}catch(e){errors.push({file,message:e instanceof Error?e.message:'Unreadable run'});}
    return {runs:runs.sort((a,b)=>b.startedAt.localeCompare(a.startedAt)||a.id.localeCompare(b.id)),errors};
  }
  private async persist(data:AcceptanceRunData){
    const value=acceptanceRunSchema.parse(data),dir=await this.directory(true);
    if(!dir)throw new Error('Acceptance directory unavailable');
    const raw=JSON.stringify(value,null,2)+'\n';
    if(Buffer.byteLength(raw)>FILE_LIMIT)throw new ConflictError('Acceptance run exceeds size limit');
    const temp=join(dir,'.'+randomUUID()+'.tmp');
    try{await writeFile(temp,raw,{flag:'wx',flush:true});await rename(temp,join(dir,this.filename(value.testId,value.id)));}
    finally{await unlink(temp).catch(()=>undefined);}
    return this.get(value.testId,value.id);
  }
  create(testId:string,input:StartAcceptance){return this.serialize(async()=>{
    const requested=startAcceptanceSchema.parse(input),scope=await this.scope(testId);
    if(scope.record.revision!==requested.expectedDefinitionRevision||scope.head!==requested.expectedHead)throw new ConflictError('Test definition or Git revision changed. Refresh before starting.');
    const parsed=acceptanceDefinition(scope.record);
    if(parsed.state!=='available')throw new ConflictError(parsed.state==='invalid'?parsed.message:'This record has no supported acceptance definition');
    if((await this.files(testId)).length>=RUN_LIMIT)throw new ConflictError('Archive older local runs before starting another');
    const now=new Date().toISOString();
    return this.persist({version:1,id:randomUUID(),testId,testTitle:scope.record.title,definitionRevision:scope.record.revision,testedRevision:scope.head,definition:parsed.definition,reviewer:requested.reviewer,environment:requested.environment,startedAt:now,updatedAt:now,results:[],decision:'open',decisionNotes:'',verification:scope.verification?.revision===scope.head?scope.verification:null});
  });}
  update(testId:string,id:string,input:UpdateAcceptance){return this.serialize(async()=>{
    const requested=updateAcceptanceSchema.parse(input),run=await this.get(testId,id);
    if(run.revision!==requested.expectedRevision)throw new ConflictError('Review changed on disk. Reload the saved run before updating.');
    if(run.decision!=='open')throw new ConflictError('This review is finalized. Start a new run.');
    const scope=await this.scope(testId);
    if(!currentAcceptance(run,scope.head,scope.record.revision))throw new ConflictError('This run belongs to a different revision or test definition. Start a new run.');
    if(requested.action==='case'&&!run.definition.groups.some(g=>g.cases.some(c=>c.id===requested.caseId)))throw new ConflictError('Unknown case ID');
    const {revision:_,...data}=run;
    const next=applyAcceptanceUpdate(data,requested,new Date().toISOString());
    return this.persist({...next,verification:scope.verification?.revision===run.testedRevision?scope.verification:run.verification});
  });}
}

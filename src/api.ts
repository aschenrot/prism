import type { Editable, ProjectRecord, RecordList, TrashList, PropertyChanges } from '../shared/records';
import type { ProjectInfo, RepositoryIndex,CreateWorkspaceInput,WorkspaceCreationAvailability } from '../shared/projects';
import type { ProjectSearchResult } from '../shared/search';
import type { ProjectSchemaResult,ProjectPropertySchema } from '../shared/customProperties';
import type { GitHistory } from '../shared/delivery';
import type { VerificationResult } from '../shared/verification';
import type { BrowserVerificationResult } from '../shared/browserVerification';
import type { HostedVerificationResult,HostedPullResult,HostedJobsResult,PullReference } from '../shared/hostedVerification';
import type { TemplateInput,RecordTemplate,TemplateList } from '../shared/templates';
import type { SavedView, ViewInput, ViewList } from '../shared/views';
import type { AcceptanceList,AcceptanceRun,StartAcceptance,UpdateAcceptance } from '../shared/acceptance';
export class ApiError extends Error {
  constructor(message:string,readonly status:number){super(message);this.name='ApiError';}
}
async function request<T>(path:string, init?:RequestInit):Promise<T> {
  const response = await fetch(path,init);
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new ApiError(data.error || 'Request failed (' + response.status + ')',response.status);
  }
  return response.json();
}
const json = (method:string, body:unknown):RequestInit => ({method,headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
const base=(id:string)=>'/api/projects/'+encodeURIComponent(id);
const acceptance=(project:string,test:string)=>base(project)+'/acceptance/'+encodeURIComponent(test);
export const api = {
  acceptanceRuns:(project:string,test:string)=>request<AcceptanceList>(acceptance(project,test)),
  acceptanceRun:(project:string,test:string,id:string)=>request<AcceptanceRun>(acceptance(project,test)+'/'+encodeURIComponent(id)),
  startAcceptance:(project:string,test:string,input:StartAcceptance)=>request<AcceptanceRun>(acceptance(project,test),json('POST',input)),
  updateAcceptance:(project:string,test:string,id:string,input:UpdateAcceptance)=>request<AcceptanceRun>(acceptance(project,test)+'/'+encodeURIComponent(id),json('PUT',input)),
  templates:(project:string)=>request<TemplateList>(base(project)+'/templates'),
  createTemplate:(project:string,template:TemplateInput)=>request<RecordTemplate>(base(project)+'/templates',json('POST',template)),
  updateTemplate:(project:string,id:string,expectedRevision:string,template:TemplateInput)=>request<RecordTemplate>(base(project)+'/templates/'+encodeURIComponent(id),json('PUT',{expectedRevision,template})),
  instantiateTemplate:(project:string,id:string,expectedRevision:string,title:string,expectedSchemaRevision?:string)=>request<ProjectRecord>(base(project)+'/templates/'+encodeURIComponent(id)+'/instantiate',json('POST',{expectedRevision,title,expectedSchemaRevision})),
  views:(project:string)=>request<ViewList>(base(project)+'/views'),
  createView:(project:string,view:ViewInput)=>request<SavedView>(base(project)+'/views',json('POST',view)),
  updateView:(project:string,id:string,expectedRevision:string,view:ViewInput)=>request<SavedView>(base(project)+'/views/'+encodeURIComponent(id),json('PUT',{expectedRevision,view})),
  removeView:(project:string,id:string,expectedRevision:string)=>request<{ok:boolean}>(base(project)+'/views/'+encodeURIComponent(id),json('DELETE',{expectedRevision})),
  projects:()=>request<ProjectInfo[]>('/api/projects'),
  workspaceCreation:()=>request<WorkspaceCreationAvailability>('/api/workspace-creation'),
  createWorkspace:(input:CreateWorkspaceInput)=>request<ProjectInfo>('/api/projects',json('POST',input)),
  trash:(project:string)=>request<TrashList>(base(project)+'/trash'),
  moveToTrash:(project:string,id:string,expectedRevision:string)=>request<ProjectRecord>(base(project)+'/records/'+encodeURIComponent(id)+'/trash',json('POST',{expectedRevision})),
  restoreTrash:(project:string,id:string,expectedRevision:string)=>request<ProjectRecord>(base(project)+'/trash/'+encodeURIComponent(id)+'/restore',json('POST',{expectedRevision})),
  schema:(project:string)=>request<ProjectSchemaResult>(base(project)+'/schema'),
  updateSchema:(project:string,expectedRevision:string,definition:ProjectPropertySchema)=>request<ProjectSchemaResult>(base(project)+'/schema',json('PUT',{expectedRevision,definition})),
  search:(project:string,query:string)=>request<ProjectSearchResult>(base(project)+'/search',json('POST',{query})),
  list:(project:string)=>request<RecordList>(base(project)+'/records'),
  capture:(project:string,title:string,body:string)=>request<ProjectRecord>(base(project)+'/inbox',json('POST',{title,body})),
  updatePullReferences:(project:string,id:string,expectedRevision:string,references:PullReference[])=>request<ProjectRecord>(base(project)+'/records/'+encodeURIComponent(id)+'/pull-references',json('PUT',{expectedRevision,references})),
  setInbox:(project:string,id:string,expectedRevision:string,inbox:boolean)=>request<ProjectRecord>(base(project)+'/records/'+encodeURIComponent(id)+'/inbox',json('PUT',{expectedRevision,inbox})),
  create:(project:string,title:string,type:Editable['type'],customTypeId?:string,expectedSchemaRevision?:string)=>request<ProjectRecord>(base(project)+'/records',json('POST',{title,type,customTypeId,expectedSchemaRevision})),
  duplicate:(project:string,id:string,expectedRevision:string)=>request<ProjectRecord>(base(project)+'/records/'+encodeURIComponent(id)+'/duplicate',json('POST',{expectedRevision})),
  updateProperties:(project:string,id:string,expectedRevision:string,changes:PropertyChanges)=>request<ProjectRecord>(base(project)+'/records/'+encodeURIComponent(id)+'/properties',json('PUT',{expectedRevision,changes})),
  update:(project:string,id:string,expectedRevision:string,changes:Editable,expectedSchemaRevision?:string)=>request<ProjectRecord>(base(project)+'/records/'+encodeURIComponent(id),json('PUT',{expectedRevision,changes,expectedSchemaRevision})),
  hostedPull:(project:string,id:string,number:number)=>request<HostedPullResult>(base(project)+'/records/'+encodeURIComponent(id)+'/hosted-pull',json('POST',{number})),
  hostedJobs:(project:string,runId:number,attempt:number)=>request<HostedJobsResult>(base(project)+'/hosted-jobs',json('POST',{runId,attempt})),
  hostedVerification:(project:string)=>request<HostedVerificationResult>(base(project)+'/hosted-verification',json('POST',{})),
  browserVerification:(project:string)=>request<BrowserVerificationResult>(base(project)+'/browser-verification'),
  verification:(project:string)=>request<VerificationResult>(base(project)+'/verification'),
  changes:(project:string)=>request<GitHistory>(base(project)+'/changes'),
  repository:(project:string)=>request<RepositoryIndex>(base(project)+'/repository'),
  file:(project:string,path:string)=>request<{path:string;content:string}>(base(project)+'/file?path='+encodeURIComponent(path))
};

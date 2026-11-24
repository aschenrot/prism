import type { Editable, ProjectRecord, RecordList, TrashList } from '../shared/records';
import type { ProjectInfo, RepositoryIndex } from '../shared/projects';
import type { GitHistory } from '../shared/delivery';
import type { VerificationResult } from '../shared/verification';
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
  views:(project:string)=>request<ViewList>(base(project)+'/views'),
  createView:(project:string,view:ViewInput)=>request<SavedView>(base(project)+'/views',json('POST',view)),
  updateView:(project:string,id:string,expectedRevision:string,view:ViewInput)=>request<SavedView>(base(project)+'/views/'+encodeURIComponent(id),json('PUT',{expectedRevision,view})),
  removeView:(project:string,id:string,expectedRevision:string)=>request<{ok:boolean}>(base(project)+'/views/'+encodeURIComponent(id),json('DELETE',{expectedRevision})),
  projects:()=>request<ProjectInfo[]>('/api/projects'),
  trash:(project:string)=>request<TrashList>(base(project)+'/trash'),
  moveToTrash:(project:string,id:string,expectedRevision:string)=>request<ProjectRecord>(base(project)+'/records/'+encodeURIComponent(id)+'/trash',json('POST',{expectedRevision})),
  restoreTrash:(project:string,id:string,expectedRevision:string)=>request<ProjectRecord>(base(project)+'/trash/'+encodeURIComponent(id)+'/restore',json('POST',{expectedRevision})),
  list:(project:string)=>request<RecordList>(base(project)+'/records'),
  create:(project:string,title:string,type:Editable['type'])=>request<ProjectRecord>(base(project)+'/records',json('POST',{title,type})),
  update:(project:string,id:string,expectedRevision:string,changes:Editable)=>request<ProjectRecord>(base(project)+'/records/'+encodeURIComponent(id),json('PUT',{expectedRevision,changes})),
  verification:(project:string)=>request<VerificationResult>(base(project)+'/verification'),
  changes:(project:string)=>request<GitHistory>(base(project)+'/changes'),
  repository:(project:string)=>request<RepositoryIndex>(base(project)+'/repository'),
  file:(project:string,path:string)=>request<{path:string;content:string}>(base(project)+'/file?path='+encodeURIComponent(path))
};

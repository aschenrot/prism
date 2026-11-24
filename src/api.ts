import type { Editable, ProjectRecord, RecordList } from '../shared/records';
import type { ProjectInfo, RepositoryIndex } from '../shared/projects';
async function request<T>(path:string, init?:RequestInit):Promise<T> {
  const response = await fetch(path,init);
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'Request failed (' + response.status + ')');
  }
  return response.json();
}
const json = (method:string, body:unknown):RequestInit => ({method,headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
const base=(id:string)=>'/api/projects/'+encodeURIComponent(id);
export const api = {
  projects:()=>request<ProjectInfo[]>('/api/projects'),
  list:(project:string)=>request<RecordList>(base(project)+'/records'),
  create:(project:string,title:string,type:Editable['type'])=>request<ProjectRecord>(base(project)+'/records',json('POST',{title,type})),
  update:(project:string,id:string,expectedRevision:string,changes:Editable)=>request<ProjectRecord>(base(project)+'/records/'+encodeURIComponent(id),json('PUT',{expectedRevision,changes})),
  repository:(project:string)=>request<RepositoryIndex>(base(project)+'/repository'),
  file:(project:string,path:string)=>request<{path:string;content:string}>(base(project)+'/file?path='+encodeURIComponent(path))
};

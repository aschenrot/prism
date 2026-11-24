import type { Editable, ProjectRecord, RecordList } from '../shared/records';
async function request<T>(path:string, init?:RequestInit):Promise<T> {
  const response = await fetch(path,init);
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'Request failed (' + response.status + ')');
  }
  return response.json();
}
const json = (method:string, body:unknown):RequestInit => ({method,headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
export const api = {
  list: () => request<RecordList>('/api/records'),
  create: (title:string,type:Editable['type']) => request<ProjectRecord>('/api/records',json('POST',{title,type})),
  update: (id:string,expectedRevision:string,changes:Editable) => request<ProjectRecord>('/api/records/'+encodeURIComponent(id),json('PUT',{expectedRevision,changes}))
};

import { Pencil } from 'lucide-react';
import type { ProjectRecord } from '../shared/records';
export default function CollectionEditAction({record,onEdit,disabled=false}:{record:ProjectRecord;onEdit:()=>void;disabled?:boolean}){
  return <button type="button" className="collection-edit-action secondary" aria-label={'Edit '+record.title} title={'Edit '+record.title} disabled={disabled} onClick={e=>{e.stopPropagation();onEdit();}}><Pencil size={14}/><span>Edit</span></button>;
}

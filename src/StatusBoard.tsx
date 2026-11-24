import { useEffect,useLayoutEffect,useRef,useState,type ReactNode } from 'react';
import { GripVertical } from 'lucide-react';
import { statuses,type ProjectRecord } from '../shared/records';
import Status from './Status';
type StatusValue=ProjectRecord['status'];
type Props={records:ProjectRecord[];disabled:boolean;pending:boolean;onMove:(record:ProjectRecord,status:StatusValue)=>void;renderCard:(record:ProjectRecord)=>ReactNode};
export default function StatusBoard({records,disabled,pending,onMove,renderCard}:Props){
 const drag=useRef<ProjectRecord|null>(null),[dragging,setDragging]=useState<string|null>(null),[hover,setHover]=useState<StatusValue|null>(null);
 const board=useRef<HTMLElement>(null),controls=useRef(new Map<string,HTMLSelectElement>()),focusAfter=useRef<string|null>(null);
 const clear=()=>{drag.current=null;setDragging(null);setHover(null);};
 useEffect(()=>{if(disabled){drag.current=null;setDragging(null);setHover(null);}},[disabled]);
 useLayoutEffect(()=>{if(pending||disabled||!focusAfter.current)return;const id=focusAfter.current;focusAfter.current=null;(controls.current.get(id)??board.current)?.focus({preventScroll:true});},[pending,disabled,records]);
 const move=(record:ProjectRecord,status:StatusValue,keyboard=false)=>{
  if(disabled||record.status===status||!records.some(r=>r.id===record.id))return;
  if(keyboard)focusAfter.current=record.id;
  onMove(record,status);
 };
 return <section ref={board} tabIndex={-1} aria-label="Status board">
 <p className="board-instructions">Drag a card by its handle or use Move to. Changes save the record status; cards follow the current sort and filters.</p>
 <div className="board">{statuses.map(status=>{
  const items=records.filter(r=>r.status===status);
  return <section key={status} className={'column'+(hover===status?' board-drop-target':'')} aria-label={status+' column'}
   onDragOver={e=>{if(!disabled&&drag.current&&drag.current.status!==status){e.preventDefault();e.dataTransfer.dropEffect='move';setHover(status);}}}
   onDragLeave={e=>{if(!(e.relatedTarget instanceof Node)||!e.currentTarget.contains(e.relatedTarget))setHover(old=>old===status?null:old);}}
   onDrop={e=>{if(!drag.current||disabled)return;e.preventDefault();const source=drag.current;clear();move(source,status);}}>
   <div className="column-heading"><Status value={status}/><span>{items.length}</span></div>
   {items.map(record=><div className={'board-card-shell'+(dragging===record.id?' board-dragging':'')} key={record.id}>
    {renderCard(record)}
    <div className="board-card-move">
     <span className="board-grip" title="Drag to another status column" aria-hidden="true" draggable={!disabled}
      onDragStart={e=>{if(disabled){e.preventDefault();return;}drag.current=record;setDragging(record.id);e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',record.id);}}
      onDragEnd={clear}><GripVertical size={18}/></span>
     <label><span>Move to</span><select aria-label={'Move '+record.title+' to status'} ref={node=>{if(node)controls.current.set(record.id,node);else controls.current.delete(record.id);}} disabled={disabled} value={record.status} onChange={e=>{const target=statuses.find(s=>s===e.target.value);if(target)move(record,target,true);}}>{statuses.map(s=><option key={s}>{s}</option>)}</select></label>
    </div>
   </div>)}
   {!items.length&&<p className="board-empty-column">No matching records</p>}
  </section>;
 })}</div></section>;
}

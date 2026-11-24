import { createContext,useContext,useId,useLayoutEffect,useRef,useState } from 'react';
import { Ellipsis,Pencil,Trash2,Copy,Link2,Inbox } from 'lucide-react';
import type { ProjectRecord } from '../shared/records';
export const RecordCommandContext=createContext<{duplicate:(record:ProjectRecord)=>void;copy:(record:ProjectRecord)=>void;triage:(record:ProjectRecord)=>void}|null>(null);
type Props={record:ProjectRecord;onEdit:()=>void;onTrash:()=>void;disabled?:boolean;editLabel?:string};
export default function RecordActions({record,onEdit,onTrash,disabled=false,editLabel='Edit'}:Props){
  const commands=useContext(RecordCommandContext);
  const id=useId(),trigger=useRef<HTMLButtonElement>(null),panel=useRef<HTMLDivElement>(null);
  const [open,setOpen]=useState(false);
  const isOpen=()=>!!panel.current?.matches(':popover-open');
  const items=()=>Array.from(panel.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]')||[]);
  const close=(restore=false)=>{if(isOpen())panel.current?.hidePopover();setOpen(false);if(restore)trigger.current?.focus({preventScroll:true});};
  const position=()=>{
    const button=trigger.current,menu=panel.current;
    if(!button||!menu||!menu.matches(':popover-open'))return;
    const anchor=button.getBoundingClientRect(),size=menu.getBoundingClientRect(),margin=8;
    if(anchor.width===0||anchor.height===0||anchor.bottom<=0||anchor.top>=window.innerHeight||anchor.right<=0||anchor.left>=window.innerWidth){
      menu.hidePopover();return;
    }
    menu.style.left=Math.max(margin,Math.min(anchor.right-size.width,window.innerWidth-size.width-margin))+'px';
    menu.style.top=Math.max(margin,Math.min(anchor.bottom+5+size.height<=window.innerHeight-margin?anchor.bottom+5:anchor.top-size.height-5,window.innerHeight-size.height-margin))+'px';
  };
  const show=(last=false)=>{
    const button=trigger.current,menu=panel.current;if(disabled||!button||!menu)return;
    if(!isOpen())menu.showPopover();
    position();if(!isOpen())return;
    setOpen(true);const list=items();list[last?list.length-1:0]?.focus({preventScroll:true});
  };
  useLayoutEffect(()=>{
    const menu=panel.current;if(!menu)return;
    const toggle=()=>setOpen(menu.matches(':popover-open'));
    const dismiss=()=>{if(menu.matches(':popover-open'))menu.hidePopover();};
    // Navigation restoration, focus and real scrolling can all dispatch scroll
    // events. Keep a usable menu anchored rather than dismissing on every event.
    const scroll=(event:Event)=>{if(event.target instanceof Node&&menu.contains(event.target))return;position();};
    menu.addEventListener('toggle',toggle);window.addEventListener('resize',dismiss);window.addEventListener('scroll',scroll,true);
    return()=>{menu.removeEventListener('toggle',toggle);window.removeEventListener('resize',dismiss);window.removeEventListener('scroll',scroll,true);if(menu.matches(':popover-open'))menu.hidePopover();};
  },[]);
  useLayoutEffect(()=>{if(disabled)close();},[disabled,record.id]);
  const run=(action:()=>void)=>{if(disabled)return;close(true);action();};
  return <div className="record-actions" onClick={event=>event.stopPropagation()}>
    <button ref={trigger} type="button" className="record-actions-trigger" aria-label={'Actions for '+record.title} title="Record actions" aria-haspopup="menu" aria-expanded={open} aria-controls={id} disabled={disabled} onClick={()=>{if(isOpen())close(true);else show();}} onKeyDown={event=>{if(event.key==='ArrowDown'||event.key==='ArrowUp'){event.preventDefault();show(event.key==='ArrowUp');}}}><Ellipsis size={19} aria-hidden="true"/></button>
    <div ref={panel} id={id} popover="auto" role="menu" aria-label={'Actions for '+record.title} className="record-actions-menu" onKeyDown={event=>{
      const list=items(),index=list.indexOf(document.activeElement as HTMLButtonElement);
      if(event.key==='Escape'){event.preventDefault();event.stopPropagation();close(true);}
      else if(event.key==='Tab'){close(true);}
      else if(['ArrowDown','ArrowUp','Home','End'].includes(event.key)){event.preventDefault();event.stopPropagation();const next=event.key==='Home'?0:event.key==='End'?list.length-1:event.key==='ArrowDown'?(index+1)%list.length:(index-1+list.length)%list.length;list[next]?.focus();}
    }}>
      <button role="menuitem" tabIndex={-1} type="button" onClick={()=>run(onEdit)}><Pencil size={15}/>{editLabel}</button>
      {commands&&<><button role="menuitem" tabIndex={-1} type="button" onClick={()=>run(()=>commands.duplicate(record))}><Copy size={15}/>Duplicate</button><button role="menuitem" tabIndex={-1} type="button" onClick={()=>run(()=>commands.copy(record))}><Link2 size={15}/>Copy record link</button><button role="menuitem" tabIndex={-1} type="button" onClick={()=>run(()=>commands.triage(record))}><Inbox size={15}/>{record.inbox?'Finish triage':'Add to inbox'}</button></>}
      <div className="record-actions-divider" role="separator"/>
      <button role="menuitem" tabIndex={-1} type="button" className="record-actions-danger" onClick={()=>run(onTrash)}><Trash2 size={15}/>Move to trash</button>
    </div>
  </div>;
}

import { useEffect,useRef,useState } from 'react';
import { checkedEntry,guardedTraversal,routeHash,parseRoute,type CollectionContext,type HistoryEntry,type WorkspaceRoute } from '../shared/routes';

function trailId(){return typeof crypto.randomUUID==='function'?crypto.randomUUID():Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);}
function fresh(hash:string):HistoryEntry{return {version:1,trail:trailId(),index:0,hash,scroll:0};}
function readMax(entry:HistoryEntry){
  try{const value=Number(sessionStorage.getItem('prism:history:'+entry.trail));return Number.isSafeInteger(value)&&value>=entry.index&&value<=1000000?value:entry.index;}catch{return entry.index;}
}
function writeMax(entry:HistoryEntry,max:number){try{sessionStorage.setItem('prism:history:'+entry.trail,String(max));}catch{/* Forward remains available during this session. */}}
export function useWorkspaceHistory(defaultRoute:WorkspaceRoute){
  const [entry,setEntry]=useState(()=>checkedEntry(history.state,location.hash)||fresh(location.hash||routeHash(defaultRoute)));
  const current=useRef(entry);
  const [maxIndex,setMaxIndex]=useState(()=>readMax(entry));
  const maximum=useRef(maxIndex);
  const guard=useRef('');
  const [notice,setNotice]=useState('');
  const moving=useRef(false);
  const scrollTimer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);
  const scrollPositions=useRef(new Map<string,number>());
  const keyOf=(item:HistoryEntry)=>item.trail+':'+item.index;
  const setGuard=(reason:string)=>{guard.current=reason;};
  function update(next:HistoryEntry){current.current=next;setEntry(next);}
  function rememberMax(next:HistoryEntry,max:number){maximum.current=max;setMaxIndex(max);writeMax(next,max);}
  function captureScroll(){
    const previous=current.current;
    const native=checkedEntry(history.state,previous.hash);
    if(!native||native.trail!==previous.trail||native.index!==previous.index||location.hash!==previous.hash)return;
    const scroll=Math.max(0,Math.min(window.scrollY,100000000));
    scrollPositions.current.set(keyOf(previous),scroll);
    if(scroll===previous.scroll)return;
    const next={...previous,scroll};
    current.current=next;
    history.replaceState(next,'',next.hash);
  }
  useEffect(()=>{
    const oldRestoration=history.scrollRestoration;
    history.scrollRestoration='manual';
    history.replaceState(current.current,'',current.current.hash);
    rememberMax(current.current,maximum.current);
    const cancelScroll=()=>{clearTimeout(scrollTimer.current);scrollTimer.current=undefined;};
    const onScroll=()=>{if(!moving.current&&current.current.hash===location.hash){const key=keyOf(current.current);scrollPositions.current.set(key,Math.max(0,Math.min(window.scrollY,100000000)));if(scrollPositions.current.size>1000){const first=scrollPositions.current.keys().next().value;if(first!==undefined)scrollPositions.current.delete(first);}cancelScroll();scrollTimer.current=setTimeout(captureScroll,180);}};
    const onPageHide=()=>{cancelScroll();captureScroll();};
    const onPop=()=>{
      cancelScroll();
      const previous=current.current;
      const next=checkedEntry(history.state,location.hash);
      const decision=guardedTraversal(previous,next);
      if(decision.kind==='same'){
        moving.current=false;return; // Return from a blocked traversal.
      }
      if(guard.current){
        setNotice(guard.current);
        moving.current=true;
        if(decision.kind==='return'){history.go(decision.delta);return;}
        // Unknown/manual hash entry: restore the protected page without unmounting it.
        // Retain the current UI entry identity: resetting it would unmount the editor.
        history.replaceState(previous,'',previous.hash);
        moving.current=false;return;
      }
      const loaded=next||fresh(location.hash||routeHash(defaultRoute));
      const resolved={...loaded,scroll:scrollPositions.current.get(keyOf(loaded))??loaded.scroll};
      history.replaceState(resolved,'',resolved.hash);
      const max=resolved.trail===previous.trail?Math.max(maximum.current,resolved.index):readMax(resolved);
      rememberMax(resolved,max);moving.current=false;setNotice('');update(resolved);
    };
    window.addEventListener('popstate',onPop);window.addEventListener('scroll',onScroll,{passive:true});window.addEventListener('pagehide',onPageHide);
    return()=>{cancelScroll();window.removeEventListener('popstate',onPop);window.removeEventListener('scroll',onScroll);window.removeEventListener('pagehide',onPageHide);history.scrollRestoration=oldRestoration;};
  },[]);
  const allowed=()=>{if(!guard.current)return true;setNotice(guard.current);return false;};
  const replaceContext=(context:CollectionContext)=>{
    const previous=current.current;
    if(previous.trail!==entry.trail||previous.index!==entry.index||moving.current)return;
    const next={...previous,context};
    history.replaceState(next,'',next.hash);update(next);
  };
  const go=(route:WorkspaceRoute,context?:CollectionContext,completedCreate=false)=>{
    const previous=current.current;
    if(moving.current||previous.trail!==entry.trail||previous.index!==entry.index)return false;
    if(!completedCreate&&!allowed())return false;
    const hash=routeHash(route);
    if(hash===previous.hash){if(context)replaceContext(context);return true;}
    clearTimeout(scrollTimer.current);captureScroll();
    const next:HistoryEntry={version:1,trail:previous.trail,index:previous.index+1,hash,scroll:0,context};
    for(const key of scrollPositions.current.keys()){if(key.startsWith(previous.trail+':')&&Number(key.slice(previous.trail.length+1))>previous.index)scrollPositions.current.delete(key);}
    history.pushState(next,'',hash);rememberMax(next,next.index);setNotice('');update(next);return true;
  };
  const traverse=(delta:number)=>{if(!moving.current&&allowed()){clearTimeout(scrollTimer.current);captureScroll();moving.current=true;history.go(delta);}};
  return {entry,route:parseRoute(entry.hash),entryKey:entry.trail+':'+entry.index,go,replaceContext,setGuard,notice,clearNotice:()=>setNotice(''),canBack:entry.index>0,canForward:entry.index<maxIndex,back:()=>traverse(-1),forward:()=>traverse(1)};
}
export type WorkspaceHistory=ReturnType<typeof useWorkspaceHistory>;

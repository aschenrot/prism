import { useId,useLayoutEffect,useRef,useState } from 'react';
import { ArrowDown,ArrowUp,Plus,Search,SlidersHorizontal } from 'lucide-react';
import type { EntityDefinition } from '../shared/customProperties';
import { priorities,statuses,types } from '../shared/records';
import { defaultSortDirection,sortDirection,sortDirections,sortFields,type Filters } from '../shared/views';
type Props={filters:Filters;entityTypes?:EntityDefinition[];allowType:boolean;disabled:boolean;creating:boolean;newLabel:string;onChange:(filters:Filters)=>void;onReset:()=>void;onCreate:()=>void};
export default function CollectionToolbar({filters,entityTypes,allowType,disabled,creating,newLabel,onChange,onReset,onCreate}:Props){
  const [showFilters,setShowFilters]=useState(false),[showSearch,setShowSearch]=useState(false);
  const searchOpen=showSearch||!!filters.search,searchId=useId(),searchInput=useRef<HTMLInputElement>(null),searchToggle=useRef<HTMLButtonElement>(null),focusSearch=useRef(false);
  useLayoutEffect(()=>{if(searchOpen&&focusSearch.current){focusSearch.current=false;searchInput.current?.focus();}},[searchOpen]);
  const toggleSearch=()=>{if(searchOpen){setShowSearch(false);if(filters.search)onChange({...filters,search:''});searchToggle.current?.focus();}else{focusSearch.current=true;setShowSearch(true);}};
  const count=Number(filters.status!=='Any status')+Number(filters.priority!=='Any priority')+Number(allowType&&filters.type!=='All records')+Number(!!filters.entityType);
  const entities=(entityTypes??[]).filter(e=>filters.type==='All records'||e.baseType===filters.type);
  return <section className="collection-controls" aria-label="Collection controls">
    <div className="collection-toolbar">
      <button ref={searchToggle} className="secondary collection-search-toggle" type="button" aria-expanded={searchOpen} aria-controls={searchId} disabled={disabled} onClick={toggleSearch}><Search size={16}/>{searchOpen?(filters.search?'Clear and close search':'Close search'):'Search records'}</button>
      <div id={searchId} className="collection-search" hidden={!searchOpen}>{searchOpen&&<><input ref={searchInput} aria-label="Search records" placeholder="Search records…" maxLength={300} disabled={disabled} value={filters.search} onChange={e=>onChange({...filters,search:e.target.value})} onKeyDown={e=>{if(e.key==='Escape'&&!filters.search){e.preventDefault();toggleSearch();}}}/>{filters.search&&<button type="button" className="icon-button" aria-label="Clear search" disabled={disabled} onClick={()=>{onChange({...filters,search:''});searchInput.current?.focus();}}>×</button>}</>}</div>
      <button className="secondary" type="button" aria-expanded={showFilters} disabled={disabled} onClick={()=>setShowFilters(v=>!v)}><SlidersHorizontal size={15}/> Filter{count>0?' ('+count+')':''}</button>
      <div className="collection-sort"><label className="sr-only" htmlFor="collection-sort-field">Sort by</label><select id="collection-sort-field" value={filters.sort} disabled={disabled} onChange={e=>{const sort=e.target.value as Filters['sort'];onChange({...filters,sort,direction:defaultSortDirection(sort)});}}>{sortFields.map(s=><option key={s}>{s}</option>)}</select><label className="sr-only" htmlFor="collection-sort-direction">Sort direction</label><select id="collection-sort-direction" value={sortDirection(filters)} disabled={disabled} onChange={e=>onChange({...filters,direction:e.target.value as Filters['direction']})}>{sortDirections.map(s=><option key={s}>{s}</option>)}</select></div>
      <button type="button" className="secondary" disabled={disabled} onClick={onReset}>Reset filters</button>
      <button type="button" className="primary collection-new" disabled={disabled||creating} onClick={onCreate}><Plus size={16}/>{newLabel}</button>
    </div>
    {(filters.sort==='Created'||filters.sort==='Last edited')&&<p className="collection-sort-note">{filters.sort==='Created'?'Uses recorded creation dates.':'Uses recorded last-save dates; external edits do not automatically update them.'} Undated records appear last.</p>}
    {(showFilters||count>0)&&<div className="collection-filter-row">{allowType&&<label>Collection<select aria-label="Collection" value={filters.type} disabled={disabled} onChange={e=>onChange({...filters,type:e.target.value as Filters['type'],entityType:undefined})}>{['All records',...types].map(t=><option key={t}>{t}</option>)}</select></label>}{(entities.length>0||filters.entityType)&&<label>Custom entity<select aria-label="Custom entity" value={filters.entityType??''} disabled={disabled} onChange={e=>onChange({...filters,entityType:e.target.value||undefined})}><option value="">Any entity type</option>{filters.entityType&&!entities.some(e=>e.id===filters.entityType)&&<option value={filters.entityType}>Unavailable: {filters.entityType}</option>}{entities.map(e=><option key={e.id} value={e.id}>{e.label}{e.retired?' (retired)':''}</option>)}</select></label>}<label>Status<select aria-label="Status" value={filters.status} disabled={disabled} onChange={e=>onChange({...filters,status:e.target.value as Filters['status']})}>{['Any status',...statuses].map(s=><option key={s}>{s}</option>)}</select></label><label>Priority<select aria-label="Priority" value={filters.priority} disabled={disabled} onChange={e=>onChange({...filters,priority:e.target.value as Filters['priority']})}>{['Any priority',...priorities].map(s=><option key={s}>{s}</option>)}</select></label></div>}
  </section>;
}
export function SortHeading({field,filters,disabled,onSort}:{field:Filters['sort'];filters:Filters;disabled:boolean;onSort:(field:Filters['sort'])=>void}){
  const active=filters.sort===field,direction=sortDirection(filters);
  const Icon=direction==='Ascending'?ArrowUp:ArrowDown;
  return <th aria-sort={active?(direction==='Ascending'?'ascending':'descending'):'none'}><button type="button" className="table-sort-heading" disabled={disabled} onClick={()=>onSort(field)}>{field}<span className="sort-indicator" aria-hidden="true"><Icon size={13} style={{visibility:active?'visible':'hidden'}}/></span></button></th>;
}

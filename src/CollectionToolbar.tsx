import { useState } from 'react';
import { ArrowDown,ArrowUp,Plus,Search,SlidersHorizontal } from 'lucide-react';
import { priorities,statuses,types } from '../shared/records';
import { sortDirection,sortDirections,sortFields,type Filters } from '../shared/views';
type Props={filters:Filters;allowType:boolean;disabled:boolean;creating:boolean;newLabel:string;onChange:(filters:Filters)=>void;onReset:()=>void;onCreate:()=>void};
export default function CollectionToolbar({filters,allowType,disabled,creating,newLabel,onChange,onReset,onCreate}:Props){
  const [showFilters,setShowFilters]=useState(false);
  const count=Number(filters.status!=='Any status')+Number(filters.priority!=='Any priority')+Number(allowType&&filters.type!=='All records');
  return <section className="collection-controls" aria-label="Collection controls">
    <div className="collection-toolbar">
      <div className="collection-search"><Search size={16}/><input aria-label="Search records" placeholder="Search records…" maxLength={300} disabled={disabled} value={filters.search} onChange={e=>onChange({...filters,search:e.target.value})}/>{filters.search&&<button type="button" className="icon-button" aria-label="Clear search" disabled={disabled} onClick={()=>onChange({...filters,search:''})}>×</button>}</div>
      <button className="secondary" type="button" aria-expanded={showFilters} disabled={disabled} onClick={()=>setShowFilters(v=>!v)}><SlidersHorizontal size={15}/> Filter{count>0?' ('+count+')':''}</button>
      <div className="collection-sort"><label className="sr-only" htmlFor="collection-sort-field">Sort by</label><select id="collection-sort-field" value={filters.sort} disabled={disabled} onChange={e=>{const sort=e.target.value as Filters['sort'];onChange({...filters,sort,direction:sort==='Priority'?'Descending':'Ascending'});}}>{sortFields.map(s=><option key={s}>{s}</option>)}</select><label className="sr-only" htmlFor="collection-sort-direction">Sort direction</label><select id="collection-sort-direction" value={sortDirection(filters)} disabled={disabled} onChange={e=>onChange({...filters,direction:e.target.value as Filters['direction']})}>{sortDirections.map(s=><option key={s}>{s}</option>)}</select></div>
      <button type="button" className="secondary" disabled={disabled} onClick={onReset}>Reset filters</button>
      <button type="button" className="primary collection-new" disabled={disabled||creating} onClick={onCreate}><Plus size={16}/>{newLabel}</button>
    </div>
    {(showFilters||count>0)&&<div className="collection-filter-row">{allowType&&<label>Collection<select value={filters.type} disabled={disabled} onChange={e=>onChange({...filters,type:e.target.value as Filters['type']})}>{['All records',...types].map(t=><option key={t}>{t}</option>)}</select></label>}<label>Status<select value={filters.status} disabled={disabled} onChange={e=>onChange({...filters,status:e.target.value as Filters['status']})}>{['Any status',...statuses].map(s=><option key={s}>{s}</option>)}</select></label><label>Priority<select value={filters.priority} disabled={disabled} onChange={e=>onChange({...filters,priority:e.target.value as Filters['priority']})}>{['Any priority',...priorities].map(s=><option key={s}>{s}</option>)}</select></label></div>}
  </section>;
}
export function SortHeading({field,filters,disabled,onSort}:{field:Filters['sort'];filters:Filters;disabled:boolean;onSort:(field:Filters['sort'])=>void}){
  const active=filters.sort===field,direction=sortDirection(filters);
  const Icon=direction==='Ascending'?ArrowUp:ArrowDown;
  return <th aria-sort={active?(direction==='Ascending'?'ascending':'descending'):'none'}><button type="button" className="table-sort-heading" disabled={disabled} onClick={()=>onSort(field)}>{field}{active&&<Icon size={13} aria-hidden="true"/>}</button></th>;
}

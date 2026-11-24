import type { ProjectInfo } from './projects';
import type { ProjectRecord } from './records';
import { defaultFilters,selectRecords,type Filters,type ViewInput,type SavedView } from './views';
export type RecordMode=ViewInput['mode'];
export type DestinationMode=RecordMode|'Overview'|'Audit'|'Repository'|'Changes'|'Trash'|'Schemas';
// Global visual order is independent of each destination's recommended mode.
export const modeOrder=['Table','Board','Gallery','Wiki','Relationships','Slides','Audit','Repository','Changes','Overview','Trash','Schemas'] as const satisfies readonly DestinationMode[];
export type Destination={id:string;label:string;description:string;group:string;mode:DestinationMode;type:Filters['type'];modes:DestinationMode[]};
const dest=(id:string,label:string,description:string,group:string,mode:DestinationMode,type:Filters['type']='All records',modes:DestinationMode[]=[mode]):Destination=>({id,label,description,group,mode,type,modes});
const common=[
  dest('overview','Overview','Current milestones, active work and what needs attention.','Workspace','Overview'),
  dest('work','Work','Plan tasks and review their status.','Management','Table','Task',['Table','Board']),
  dest('increments','Increments','Manage explicit delivery scope, implementation and review evidence.','Management','Table','Increment',['Table','Board','Wiki']),
  dest('roadmap','Roadmap','Review development milestones in order.','Management','Table','Milestone',['Table','Board','Wiki']),
  dest('quality','Quality','Review test records and record integrity.','Management','Audit','Test',['Audit','Table','Wiki']),
  dest('documentation','Documentation','Read and navigate authored knowledge.','Knowledge','Wiki','Document',['Wiki','Table']),
  dest('decisions','Decisions','Review why choices were made.','Knowledge','Wiki','Decision',['Wiki','Table']),
  dest('architecture','Architecture','Explore systems and their connections.','Knowledge','Relationships','System',['Relationships','Wiki','Table']),
  dest('presentations','Presentations','Present live project information.','Studio','Slides','All records',['Slides']),
  dest('library','Data library','Explore all records and create custom views.','Workspace','Table','All records',['Table','Board','Gallery','Wiki','Relationships','Slides']),
  dest('trash','Trash','Restore records that were moved out of active collections.','Workspace','Trash'),
  dest('schemas','Schemas','Configure project properties without rewriting record values.','Configuration','Schemas')
];
export function destinationsFor(project:ProjectInfo):Destination[]{
  const result=[...common];
  if(project.profiles.includes('product')){
    result.splice(1,0,
      dest('strategy','Strategy','Product objectives and direction.','Product','Wiki','Objective',['Wiki','Table']),
      dest('features','Features','Prioritize and review product capabilities.','Product','Table','Feature',['Table','Board','Wiki']),
      dest('requirements','Requirements','Inspect requirements and trace their connections.','Product','Relationships','Requirement',['Relationships','Wiki','Table']));
  }
  if(project.profiles.includes('game')){
    const pos=result.findIndex(d=>d.id==='work');
    result.splice(pos,0,
      dest('gameplay','Gameplay','Explore game mechanics.','Game design','Wiki','Mechanic',['Wiki','Table','Relationships']),
      dest('world','World','Explore locations and environments.','Game design','Gallery','Location',['Gallery','Wiki','Table']),
      dest('characters','Characters','Review character concepts.','Game design','Gallery','Character',['Gallery','Wiki','Table']),
      dest('assets','Assets','Review asset records and their metadata.','Game design','Gallery','Asset',['Gallery','Table','Wiki']));
  }
  if(project.storage==='repository')result.splice(result.findIndex(d=>d.id==='presentations'),0,dest('repository','Repository','Inspect original source and documentation.','Engineering','Repository'),dest('changes','Changes','Review local commits and explicit work references.','Engineering','Changes'));
  return result;
}
export function overviewFor(records:ProjectRecord[]){
  const tasks=selectRecords(records,{...defaultFilters,type:'Task',sort:'Priority'});
  const milestones=selectRecords(records,{...defaultFilters,type:'Milestone'});
  const objectives=selectRecords(records,{...defaultFilters,type:'Objective',sort:'Priority'});
  return {
    objectives,
    milestones,
    activeMilestones:milestones.filter(r=>r.status==='In progress'),
    activeTasks:tasks.filter(r=>r.status==='In progress'),
    plannedTasks:tasks.filter(r=>r.status==='Concept'),
    blockers:tasks.filter(r=>r.status!=='Ready'&&r.tags.some(t=>t.toLowerCase()==='blocker')),
    readyTasks:tasks.filter(r=>r.status==='Ready').length,
    totalTasks:tasks.length
  };
}

// A single navigation snapshot defines destination, view, filters and saved-view identity.
export type NavigationState={destinationId:string;view:DestinationMode;filters:Filters;savedView:SavedView|null};
export function orderedModes(destination:Destination):DestinationMode[]{
  return modeOrder.filter(mode=>destination.modes.includes(mode));
}
export function navigationFor(destination:Destination,preferred?:unknown):NavigationState{
  const view=destination.modes.find(mode=>mode===preferred)??destination.mode;
  return {destinationId:destination.id,view,filters:{...defaultFilters,type:destination.type,sort:destination.id==='work'?'Priority':'Title'},savedView:null};
}
export function navigationForSaved(savedView:SavedView):NavigationState{
  return {destinationId:'library',view:savedView.mode,filters:{...savedView.filters},savedView};
}
export function navigationMode(state:NavigationState,destination:Destination,view:DestinationMode):NavigationState{
  return state.destinationId===destination.id&&destination.modes.includes(view)?{...state,view}:state;
}
export function resetNavigationFilters(state:NavigationState,destination:Destination):NavigationState{
  return {...state,filters:navigationFor(destination).filters,savedView:null};
}

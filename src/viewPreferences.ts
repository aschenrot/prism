import type { Destination,DestinationMode,NavigationState } from '../shared/navigation';

// A browser preference, not project data. Scope by registry project ID and destination ID.
// Access to browser storage can fail (private browsing, disabled storage, quota).
type PreferenceStorage=Pick<Storage,'getItem'|'setItem'>;
export function createViewPreferences(storage:()=>PreferenceStorage|undefined){
  const session=new Map<string,DestinationMode>();
  const key=(projectId:string,destinationId:string)=>'prism:view-mode:v1:'+encodeURIComponent(projectId)+':'+encodeURIComponent(destinationId);
  function preferred(projectId:string,destination:Destination):DestinationMode|undefined{
    const k=key(projectId,destination.id);
    let value:unknown=session.get(k);
    if(value===undefined){try{value=storage()?.getItem(k);}catch{/* Session fallback. */}}
    return destination.modes.find(mode=>mode===value);
  }
  function remember(projectId:string,state:NavigationState,destination:Destination,mode:DestinationMode){
    // Only explicit changes to a regular destination may alter personal defaults.
    if(state.savedView||state.destinationId!==destination.id||!destination.modes.includes(mode))return;
    const k=key(projectId,destination.id);
    session.set(k,mode);
    try{storage()?.setItem(k,mode);}catch{/* Keep the session preference if persistence fails. */}
  }
  return {preferred,remember};
}
export const viewPreferences=createViewPreferences(()=>window.localStorage);

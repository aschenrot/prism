export const AUTOSAVE_IDLE_MS=1800;
export type AutosaveState={dirty:boolean;recordUnavailable:boolean;stale:boolean;conflictResponse:boolean;schemaStale:boolean;recovery:'stored'|'none'|'unavailable'|'conflict'|'invalid'};
export function autosaveBlock(state:AutosaveState):string|undefined{
 if(state.recordUnavailable)return 'Canonical record unavailable.';
 if(state.stale||state.conflictResponse)return 'Record changed on disk. Review the conflict.';
 if(state.schemaStale)return 'Project schema changed. Review the current definition.';
 if(state.dirty&&state.recovery!=='stored')return 'Recovery copy is not confirmed.';
}

import {test} from 'node:test';
import assert from 'node:assert/strict';
import {autosaveBlock,type AutosaveState} from '../shared/autosave';
const safe:AutosaveState={dirty:true,recordUnavailable:false,stale:false,conflictResponse:false,schemaStale:false,recovery:'stored'};
test('autosave blocks missing records, conflicts, schema changes and unconfirmed recovery',()=>{
 assert.equal(autosaveBlock(safe),undefined);
 for(const field of ['recordUnavailable','stale','conflictResponse','schemaStale'] as const)assert.ok(autosaveBlock({...safe,[field]:true}));
 for(const recovery of ['none','unavailable','conflict','invalid'] as const)assert.ok(autosaveBlock({...safe,recovery}));
 assert.equal(autosaveBlock({...safe,dirty:false,recovery:'none'}),undefined);
});

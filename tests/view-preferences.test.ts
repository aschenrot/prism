import { test } from 'node:test';
import assert from 'node:assert/strict';
import { destinationsFor,navigationFor,navigationForSaved } from '../shared/navigation';
import type { ProjectInfo } from '../shared/projects';
import type { SavedView } from '../shared/views';
import { createViewPreferences } from '../src/viewPreferences';
const project:ProjectInfo={id:'prism',title:'Prism',storage:'repository',profiles:['core','product','project']};
const destinations=destinationsFor(project);
const requirements=destinations.find(d=>d.id==='requirements')!;
const docs=destinations.find(d=>d.id==='documentation')!;
const library=destinations.find(d=>d.id==='library')!;
function fakeStorage(){
  const entries=new Map<string,string>();
  return {getItem:(key:string)=>entries.get(key)??null,setItem:(key:string,value:string)=>{entries.set(key,value);}};
}
test('view preferences persist across instances and isolate project and category',()=>{
  const storage=fakeStorage();
  const first=createViewPreferences(()=>storage);
  assert.equal(first.preferred('prism',requirements),undefined);
  first.remember('prism',navigationFor(requirements),requirements,'Wiki');
  first.remember('prism',navigationFor(docs),docs,'Table');
  first.remember('other',navigationFor(requirements),requirements,'Table');
  const reopened=createViewPreferences(()=>storage);
  assert.equal(navigationFor(requirements,reopened.preferred('prism',requirements)).view,'Wiki');
  assert.equal(reopened.preferred('prism',docs),'Table');
  assert.equal(reopened.preferred('other',requirements),'Table');
  assert.equal(reopened.preferred('other',docs),undefined);
  const changed={...requirements,modes:['Relationships'] as typeof requirements.modes};
  assert.equal(reopened.preferred('prism',changed),undefined);
  assert.equal(navigationFor(changed,reopened.preferred('prism',changed)).view,'Relationships');
});
test('saved views, invalid modes and wrong destinations cannot overwrite preferences',()=>{
  const storage=fakeStorage();
  const preferences=createViewPreferences(()=>storage);
  preferences.remember('prism',navigationFor(library),library,'Wiki');
  const saved:SavedView={id:'example',title:'Example',version:1,mode:'Gallery',filters:navigationFor(library).filters,revision:'a'.repeat(64)};
  assert.equal(navigationForSaved(saved).view,'Gallery');
  preferences.remember('prism',navigationForSaved(saved),library,'Board');
  preferences.remember('prism',navigationFor(requirements),library,'Table');
  preferences.remember('prism',navigationFor(requirements),requirements,'Board');
  assert.equal(preferences.preferred('prism',library),'Wiki');
  assert.equal(preferences.preferred('prism',requirements),undefined);
});
test('unavailable, malformed and blocked storage falls back safely',()=>{
  const preferences=createViewPreferences(()=>{throw Error('Storage unavailable');});
  assert.equal(preferences.preferred('prism',requirements),undefined);
  preferences.remember('prism',navigationFor(requirements),requirements,'Table');
  assert.equal(preferences.preferred('prism',requirements),'Table');
  const invalid=createViewPreferences(()=>({getItem:()=>'<invalid>',setItem:()=>{throw Error('Quota exceeded');}}));
  assert.equal(invalid.preferred('prism',requirements),undefined);
  invalid.remember('prism',navigationFor(requirements),requirements,'Wiki');
  assert.equal(invalid.preferred('prism',requirements),'Wiki');
});

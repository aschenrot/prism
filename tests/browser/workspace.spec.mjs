import { test,expect } from '@playwright/test';
import { rename } from 'node:fs/promises';
import { join } from 'node:path';
const project='browser-review',other='browser-other';
const prefix='/api/projects/'+project;
const editableKeys=['title','type','status','priority','accent','tags','relationships','body'];
function editable(record){return Object.fromEntries(editableKeys.map(k=>[k,record[k]]));}
function url(id,projectId=project){return '/#/projects/'+projectId+'/records/'+id;}
async function create(request,title,type='Task',projectId=project){
  const response=await request.post('/api/projects/'+projectId+'/records',{data:{title,type}});expect(response.ok()).toBeTruthy();return response.json();
}
async function update(request,record,changes,projectId=project){
  const response=await request.put('/api/projects/'+projectId+'/records/'+record.id,{data:{expectedRevision:record.revision,changes:{...editable(record),...changes}}});expect(response.ok()).toBeTruthy();return response.json();
}
async function recordOnDisk(request,id){
  const response=await request.get(prefix+'/records');expect(response.ok()).toBeTruthy();
  return (await response.json()).records.find(r=>r.id===id);
}
async function open(page,record,projectId=project){
  await page.goto(url(record.id,projectId));await expect(page.getByRole('heading',{name:record.title,exact:true})).toBeVisible();
}
async function action(page,name,recordTitle){const trigger=recordTitle?page.getByRole('button',{name:'Actions for '+recordTitle,exact:true}):page.locator('.record-page').getByRole('button',{name:/^Actions for /});await trigger.click();await page.getByRole('menu').getByRole('menuitem',{name,exact:true}).click();}
async function edit(page){await action(page,'Edit');await expect(page.getByLabel('Title',{exact:true})).toBeVisible();}
function title(page){return page.getByLabel('Title',{exact:true});}
function keep(page){return page.locator('.inspector-top').getByRole('button',{name:'Keep draft & close',exact:true});}
function acceptDialog(page){page.once('dialog',dialog=>dialog.accept());}
function save(page){return page.getByRole('button',{name:'Save',exact:true});}
test.beforeEach(async({request})=>{
  // A running real workspace must never be used by this suite.
  const result=await request.get('/api/projects');expect(result.ok()).toBeTruthy();
  const projects=await result.json();
  expect(projects.map(p=>p.id)).toEqual([project,other]);
  expect(projects[0].title).toBe('Browser fixture '+process.env.PRISM_BROWSER_TEST_TOKEN);
});
test('cancel fresh edits and restore the earlier recovery checkpoint when resuming',async({page,request})=>{
  const record=await create(request,'Cancel fixture');await open(page,record);await edit(page);
  await title(page).fill('Cancelled title');acceptDialog(page);await page.getByRole('button',{name:'Cancel',exact:true}).click();
  await expect(page.getByRole('heading',{name:record.title,exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'Resume draft'})).toHaveCount(0);
  await edit(page);await title(page).fill('Earlier recovery');await keep(page).click();
  await page.getByRole('button',{name:'Resume draft'}).click();await expect(title(page)).toHaveValue('Earlier recovery');
  await title(page).fill('Later edit');acceptDialog(page);await page.getByRole('button',{name:'Cancel',exact:true}).click();
  await page.getByRole('button',{name:'Resume draft'}).click();await expect(title(page)).toHaveValue('Earlier recovery');
  expect((await recordOnDisk(request,record.id)).title).toBe(record.title);
  await keep(page).click();
});
test('recover incomplete edits after reload and save canonical content',async({page,request})=>{
  const record=await create(request,'Recovery fixture');await open(page,record);await edit(page);
  await title(page).fill('');await page.locator('.editor textarea').fill('Unsaved notes');await keep(page).click();
  expect((await recordOnDisk(request,record.id)).body).toBe('');
  await page.reload();await page.getByRole('button',{name:'Resume draft'}).click();
  await expect(title(page)).toHaveValue('');await expect(page.locator('.editor textarea')).toHaveValue('Unsaved notes');
  await title(page).fill('Recovered title');await save(page).click();
  await expect(page.getByText('No unsaved changes',{exact:true})).toBeVisible();
  expect((await recordOnDisk(request,record.id)).title).toBe('Recovered title');
  await page.getByRole('button',{name:'Return to record',exact:true}).click();
  await expect(page.locator('.record-page').getByRole('button',{name:/^Actions for /})).toBeVisible();
});
test('blocked navigation is a toast and does not lose input; saved collection context returns',async({page,request})=>{
  const record=await create(request,'Navigation fixture');
  await page.goto('/#/projects/'+project+'/work');
  await page.getByRole('textbox',{name:'Search records'}).fill(record.title);
  await page.getByRole('link',{name:record.title,exact:true}).click();
  await expect(page).toHaveURL(new RegExp('/records/'+record.id+'$'));
  await edit(page);await title(page).fill('Dirty navigation title');
  await page.getByRole('button',{name:'Back',exact:true}).click();
  await expect(page.getByText('Navigation paused',{exact:true})).toBeVisible();
  await expect(title(page)).toHaveValue('Dirty navigation title');
  await page.getByRole('button',{name:'Dismiss notification'}).click();
  await keep(page).click();await page.getByRole('button',{name:'Back',exact:true}).click();
  await expect(page.getByRole('textbox',{name:'Search records'})).toHaveValue(record.title);
  await page.getByRole('button',{name:'Forward',exact:true}).click();
  await expect(page.getByRole('button',{name:'Resume draft'})).toBeVisible();
  await page.getByRole('navigation',{name:'Breadcrumb'}).getByRole('link',{name:'Work',exact:true}).click();
  await expect(page).toHaveURL(/\/work$/);
});
test('nonoverlapping external changes combine and overlapping fields require a choice',async({page,request})=>{
  const record=await create(request,'Conflict fixture');await open(page,record);await edit(page);
  await page.locator('.editor textarea').fill('Local notes');
  const disk=await update(request,record,{priority:'High'});
  await expect(page.getByText('No overlapping field edits detected.',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Apply reviewed changes'}).click();await save(page).click();
  await expect(page.getByText('No unsaved changes',{exact:true})).toBeVisible();
  const combined=await recordOnDisk(request,record.id);
  expect(combined.priority).toBe(disk.priority);expect(combined.body).toBe('Local notes');
  await title(page).fill('My competing title');await update(request,combined,{title:'External competing title'});
  await expect(page.getByRole('heading',{name:'Record changed on disk'})).toBeVisible();
  await expect(page.getByRole('button',{name:'Apply reviewed changes'})).toBeDisabled();
  await page.getByRole('radio',{name:/My draft value/}).check();
  await page.getByRole('button',{name:'Apply reviewed changes'}).click();await save(page).click();
  await expect(page.getByText('No unsaved changes',{exact:true})).toBeVisible();
  expect((await recordOnDisk(request,record.id)).title).toBe('My competing title');
});
test('a missing canonical file leaves the dirty editor mounted and blocks saving',async({page,request})=>{
  const record=await create(request,'Missing-file fixture');await open(page,record);await edit(page);
  await title(page).fill('Protected input');
  const path=join(process.env.PRISM_BROWSER_FIXTURE_ROOT,'repo','.prism','records',record.id+'.md'),backup=path+'.test-backup';
  await rename(path,backup);
  try{
    await expect(page.getByText(/record file is missing or invalid/i)).toBeVisible();
    await expect(title(page)).toHaveValue('Protected input');await expect(save(page)).toBeDisabled();
    await expect(page.getByRole('button',{name:'Export draft'})).toBeVisible();
  }finally{await rename(backup,path);}
  await expect(save(page)).toBeEnabled();
  await keep(page).click();
});
test('competing tabs keep the first recovery and a separate project remains isolated',async({page,context,request})=>{
  const record=await create(request,'Competing tabs fixture');
  const second=await context.newPage();
  await open(page,record);await edit(page);await open(second,record);await edit(second);
  await title(page).fill('First tab');await title(second).fill('Second tab');
  await expect(second.getByText(/Recovery data changed in another window/)).toBeVisible();
  await expect(title(second)).toHaveValue('Second tab');
  await keep(page).click();
  await page.getByRole('button',{name:'Resume draft'}).click();await expect(title(page)).toHaveValue('First tab');await keep(page).click();
  const isolated=await create(request,'Other project fixture','Task',other);
  await open(page,isolated,other);await expect(page.getByRole('button',{name:'Resume draft'})).toHaveCount(0);
  await second.close({runBeforeUnload:false});
});
test('review saves and advances, restores progress and requires observations and explicit decisions',async({page,request})=>{
  const initial=await create(request,'Browser acceptance fixture','Test');
  const record=await update(request,initial,{tags:['acceptance'],body:'## Review instructions\nDisposable fixture.\n\n## A. Smoke\n- [ ] A01 — **First check** — Inspect a record. Expected: Record visible.\n- [ ] A02 — **Second check** — Inspect navigation. Expected: Navigation works.\n'});
  await open(page,record);
  await page.getByRole('textbox',{name:'Reviewer',exact:true}).fill('Fixture reviewer');
  await page.getByRole('textbox',{name:'Test environment',exact:true}).fill('Browser fixture');
  await page.getByRole('button',{name:'Start acceptance',exact:true}).click();
  await expect(page.getByRole('heading',{name:'First check',exact:true})).toBeVisible();
  await page.locator('input[name="case-outcome"][value="Failed"]').check();
  await expect(page.getByRole('button',{name:'Save result',exact:true})).toBeDisabled();
  await page.getByLabel(/Observations/).fill('Observed mismatch');
  await page.getByRole('button',{name:'Save & next',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Second check',exact:true})).toBeVisible();
  await page.reload();await expect(page.getByRole('heading',{name:'Second check',exact:true})).toBeVisible();
  await expect(page.getByText('1 failed',{exact:true})).toBeVisible();
  await page.locator('input[name="case-outcome"][value="Passed"]').check();
  await page.getByRole('button',{name:'Save result',exact:true}).click();
  await expect(page.getByRole('progressbar',{name:'Cases passed'})).toHaveAttribute('aria-valuenow','1');
  await page.getByRole('button',{name:'Record review decision'}).click();
  await page.getByLabel('Review decision notes').fill('Correct the failed case.');
  await expect(page.getByRole('button',{name:'Accept review'})).toBeDisabled();
  acceptDialog(page);await page.getByRole('button',{name:'Request changes',exact:true}).click();
  await expect(page.getByText('Changes requested',{exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'Copy review summary'})).toBeEnabled();
  expect((await recordOnDisk(request,record.id)).revision).toBe(record.revision);
  const response=await request.get(prefix+'/acceptance/'+record.id);expect(response.ok()).toBeTruthy();
  const runs=(await response.json()).runs;expect(runs).toHaveLength(1);expect(runs[0].decision).toBe('changes-requested');
});

test('collection toolbar sorts both directions and opens the editor directly while retaining context',async({page,request})=>{
  const a=await create(request,'Sort sample Alpha'),b=await create(request,'Sort sample Beta');await update(request,a,{priority:'Low'});await update(request,b,{priority:'High'});
  await page.goto('/#/projects/'+project+'/work');
  const search=page.getByRole('textbox',{name:'Search records'});await search.fill('Sort sample');
  const rows=page.locator('.record-table-title');await expect(rows).toHaveText([b.title,a.title]);
  await page.getByRole('combobox',{name:'Sort direction'}).selectOption('Ascending');await expect(rows).toHaveText([a.title,b.title]);
  await page.getByRole('button',{name:'Title',exact:true}).click();await expect(rows).toHaveText([a.title,b.title]);await page.getByRole('button',{name:'Title',exact:true}).click();await expect(rows).toHaveText([b.title,a.title]);
  await expect(page.locator('th[aria-sort="descending"]')).toHaveText('Title');
  await action(page,'Edit',a.title);await expect(title(page)).toHaveValue(a.title);
  await page.getByRole('button',{name:'Cancel',exact:true}).click();await page.getByRole('button',{name:'Back',exact:true}).click();
  await expect(search).toHaveValue('Sort sample');await expect(rows).toHaveText([b.title,a.title]);
  await expect(page.locator('.topbar').getByRole('button',{name:'New task'})).toHaveCount(0);
  await page.getByRole('button',{name:'New task',exact:true}).click();await expect(page.locator('.create-form select')).toBeDisabled();await expect(page.locator('.create-form select')).toHaveValue('Task');
  await page.getByLabel('Record title').fill('Sort sample Created');await page.getByRole('button',{name:'Create',exact:true}).click();await expect(title(page)).toHaveValue('Sort sample Created');
});
test('wiki reader follows filters and board cards have direct edit actions',async({page,request})=>{
  const a=await create(request,'Reader Alpha','Document'),b=await create(request,'Reader Beta','Document');
  await page.goto('/#/projects/'+project+'/documentation');await page.getByRole('button',{name:'Wiki',exact:true}).click();await page.getByRole('textbox',{name:'Search records'}).fill('Reader');const index=page.getByRole('navigation',{name:'Knowledge index',exact:true});await index.getByRole('button',{name:/^Reader Beta\s*Document$/}).click();await expect(page.locator('.knowledge-heading h2')).toHaveText(b.title);await index.getByRole('button',{name:/^Reader Alpha\s*Document$/}).click();
  await expect(page.locator('.knowledge-heading h2')).toHaveText(a.title);await page.getByRole('textbox',{name:'Search records'}).fill('Reader Beta');await expect(page.locator('.knowledge-heading h2')).toHaveText(b.title);
  await page.getByRole('textbox',{name:'Search records'}).fill('No matches here');await expect(page.locator('.knowledge-heading h2')).toHaveCount(0);
  const task=await create(request,'Board edit fixture');await page.goto('/#/projects/'+project+'/work');await page.getByRole('button',{name:'Board',exact:true}).click();await page.getByRole('textbox',{name:'Search records'}).fill(task.title);await action(page,'Edit',task.title);await expect(title(page)).toHaveValue(task.title);
});

test('move to trash is reversible, keeps links and protects an existing recovery draft',async({page,request})=>{
  const record=await create(request,'Trash browser fixture'),source=await create(request,'Linked trash source');await update(request,source,{relationships:[record.id]});
  await open(page,record);await edit(page);await title(page).fill('Unsaved trash draft');await keep(page).click();
  await action(page,'Move to trash');const blocked=page.getByRole('dialog',{name:'Cannot move record'});await expect(blocked).toBeVisible();await blocked.getByRole('button',{name:'Close',exact:true}).click();await expect(page.getByRole('button',{name:'Resume draft'})).toBeVisible();
  await page.getByRole('button',{name:'Resume draft'}).click();acceptDialog(page);await page.getByRole('button',{name:'Discard draft',exact:true}).click();
  await page.getByRole('button',{name:'Return to record',exact:true}).click();
  await action(page,'Move to trash');const dialog=page.getByRole('dialog',{name:'Move record to trash?'});await expect(dialog.getByText('1 linked record',{exact:true})).toBeVisible();await expect(dialog.getByText(source.title,{exact:true})).toBeVisible();await expect(dialog.getByRole('button',{name:'Cancel',exact:true})).toBeFocused();await page.keyboard.press('Escape');await expect(dialog).toHaveCount(0);expect(await recordOnDisk(request,record.id)).toBeTruthy();await action(page,'Move to trash');await dialog.getByRole('button',{name:'Move to trash',exact:true}).click();await expect(page).toHaveURL(/\/trash$/);
  await expect(page.getByRole('button',{name:'Restore '+record.title})).toBeVisible();
  expect(await recordOnDisk(request,record.id)).toBeUndefined();expect((await recordOnDisk(request,source.id)).relationships).toContain(record.id);
  await page.getByRole('button',{name:'Restore '+record.title}).click();await expect(page.getByText('Restored '+record.title+'.',{exact:true})).toBeVisible();
  expect((await recordOnDisk(request,record.id)).revision).toBe(record.revision);await open(page,record);
});

test('sort headers reserve their width and date sorting orders authored records',async({page,request})=>{
 const a=await create(request,'Dates Alpha'),b=await create(request,'Dates Beta');await update(request,a,{title:'Dates Alpha edited'});await page.goto('/#/projects/'+project+'/work');await page.getByRole('textbox',{name:'Search records'}).fill('Dates');const rows=page.locator('.record-table-title');await expect(rows).toHaveCount(2);const headers=page.locator('.table-wrap thead th');const widths=()=>headers.evaluateAll(nodes=>nodes.map(n=>{const rect=n.getBoundingClientRect();return [Math.round(rect.x*10),Math.round(rect.width*10)];}));const before=await widths();await page.getByRole('button',{name:'Title',exact:true}).click();expect(await widths()).toEqual(before);await page.getByRole('button',{name:'Title',exact:true}).click();expect(await widths()).toEqual(before);await page.getByRole('combobox',{name:'Sort by',exact:true}).selectOption('Created');await expect(page.getByRole('combobox',{name:'Sort direction'})).toHaveValue('Descending');const first=Date.parse(a.createdAt)<Date.parse(b.createdAt)?b.title:'Dates Alpha edited';await expect(rows.first()).toHaveText(first);await page.getByRole('combobox',{name:'Sort by',exact:true}).selectOption('Last edited');await expect(rows.first()).toHaveText('Dates Alpha edited');
});

test('record menus support keyboard and collection removal without losing search context',async({page,request})=>{
 const record=await create(request,'Menu fixture target'),otherRecord=await create(request,'Menu fixture other');await page.goto('/#/projects/'+project+'/work');await page.getByRole('textbox',{name:'Search records'}).fill('Menu fixture');
 const trigger=page.getByRole('button',{name:'Actions for '+record.title,exact:true});await trigger.focus();await page.keyboard.press('ArrowDown');const menu=page.getByRole('menu',{name:'Actions for '+record.title});await expect(menu.getByRole('menuitem',{name:'Edit',exact:true})).toBeFocused();await page.keyboard.press('ArrowDown');await expect(menu.getByRole('menuitem',{name:'Duplicate',exact:true})).toBeFocused();await page.keyboard.press('End');await expect(menu.getByRole('menuitem',{name:'Move to trash',exact:true})).toBeFocused();await page.keyboard.press('Escape');await expect(menu).toBeHidden();await expect(trigger).toBeFocused();
 await trigger.click();await page.getByRole('button',{name:'Actions for '+otherRecord.title,exact:true}).click();await expect(menu).toBeHidden();await page.keyboard.press('Escape');
 await action(page,'Move to trash',record.title);const dialog=page.getByRole('dialog',{name:'Move record to trash?'});await dialog.getByRole('button',{name:'Cancel',exact:true}).click();await expect(trigger).toBeFocused();await action(page,'Move to trash',record.title);await dialog.getByRole('button',{name:'Move to trash',exact:true}).click();
 await expect(page).toHaveURL(/\/work$/);await expect(page.getByRole('textbox',{name:'Search records'})).toHaveValue('Menu fixture');await expect(trigger).toHaveCount(0);await expect(page.getByRole('link',{name:otherRecord.title,exact:true})).toBeVisible();await expect(page.getByText('Moved '+record.title+' to Trash.',{exact:true})).toBeVisible();
 await page.getByRole('button',{name:'View Trash',exact:true}).click();await page.getByRole('button',{name:'Restore '+record.title,exact:true}).click();await expect(page.getByText('Restored '+record.title+'.',{exact:true})).toBeVisible();
});
test('relationship search limits candidates and saves only compatible selected targets',async({page,request})=>{
 const source=await create(request,'Relationship search fixture'),target=await create(request,'Requirement search target','Requirement'),incompatible=await create(request,'Task search target','Task');
 await open(page,source);await edit(page);await page.getByLabel('Relationship type',{exact:true}).selectOption('implements');
 const search=page.getByLabel('Search compatible records',{exact:true}),select=page.getByLabel('Target record',{exact:true});
 await search.fill('search target');await expect(select.locator('option')).toHaveCount(2);await expect(select.locator('option[value="'+incompatible.id+'"]')).toHaveCount(0);await select.selectOption(target.id);await page.getByRole('button',{name:'Add relationship',exact:true}).click();await expect(page.getByRole('button',{name:'Add relationship',exact:true})).toBeDisabled();await expect(select.locator('option[value="'+target.id+'"]')).toHaveCount(0);
 await save(page).click();await expect(page.getByText('No unsaved changes',{exact:true})).toBeVisible();expect((await recordOnDisk(request,source.id)).relationships).toContainEqual({kind:'implements',target:target.id});
});

test('inline properties and bounded bulk selection preserve recovery and report actual results',async({page,request})=>{
 const a=await create(request,'Bulk fixture Alpha'),b=await create(request,'Bulk fixture Beta'),c=await create(request,'Bulk fixture protected');
 await open(page,c);await edit(page);await title(page).fill('Protected local draft');await keep(page).click();
 await page.goto('/#/projects/'+project+'/work');await page.getByRole('textbox',{name:'Search records'}).fill('Bulk fixture');
 await page.getByRole('combobox',{name:'Status for '+a.title,exact:true}).selectOption('In progress');await expect(page.getByText(a.title+' saved.',{exact:true})).toBeVisible();
 expect((await recordOnDisk(request,a.id)).status).toBe('In progress');await expect(page).toHaveURL(/\/work$/);
 await page.getByRole('checkbox',{name:'Select all visible records'}).check();await expect(page.getByText('3 selected',{exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Edit selected',exact:true}).click();const dialog=page.getByRole('dialog',{name:'Edit 3 selected records'});await dialog.getByLabel('Priority',{exact:true}).selectOption('High');await dialog.getByRole('button',{name:'Apply changes'}).click();
 const result=page.getByRole('dialog',{name:'Bulk edit results'});await expect(result.getByText('2 confirmed · 1 not updated or unconfirmed')).toBeVisible();await expect(result.getByText(c.title,{exact:true})).toBeVisible();
 expect((await recordOnDisk(request,b.id)).priority).toBe('High');expect((await recordOnDisk(request,c.id)).priority).toBe('Normal');await result.getByRole('button',{name:'Done',exact:true}).click();
 await page.getByRole('checkbox',{name:'Select '+a.title,exact:true}).check();await page.getByRole('textbox',{name:'Search records'}).fill(b.title);await expect(page.getByText('1 selected',{exact:true})).toHaveCount(0);
 await open(page,c);await page.getByRole('button',{name:'Resume draft'}).click();await expect(title(page)).toHaveValue('Protected local draft');await keep(page).click();
});
test('duplicate starts independent work and copy link is a stable project record address',async({page,request,context})=>{
 const source=await create(request,'Duplicate fixture');const saved=await update(request,source,{status:'Ready',priority:'High',body:'Copied notes',tags:['current','custom'],relationships:['missing-example']});
 await context.grantPermissions(['clipboard-read','clipboard-write']);await open(page,saved);await action(page,'Copy record link');
 await expect(page.getByText(saved.title+' · record link copied.',{exact:true})).toBeVisible();expect(await page.evaluate(()=>navigator.clipboard.readText())).toMatch(new RegExp('/#/projects/'+project+'/records/'+saved.id+'$'));
 await action(page,'Duplicate');await expect(title(page)).toHaveValue(saved.title+' (copy)');const copyId=page.url().split('/').pop();expect(copyId).not.toBe(saved.id);
 const copy=await recordOnDisk(request,copyId);expect(copy.body).toBe('Copied notes');expect(copy.status).toBe('Concept');expect(copy.priority).toBe('High');expect(copy.relationships).toEqual([]);expect(copy.tags).toEqual(['custom']);expect((await recordOnDisk(request,saved.id)).revision).toBe(saved.revision);
});

test('delivery increments show explicit task scope and independent local evidence',async({page,request})=>{
 const task=await create(request,'Increment scoped task'),outside=await create(request,'Increment outside task'),testRecord=await create(request,'Increment scope review','Test');
 const increment=await create(request,'Delivery fixture','Increment'),milestone=await create(request,'Delivery fixture milestone','Milestone');
 const scoped=await update(request,increment,{status:'In progress',relationships:[{kind:'contains',target:task.id},{kind:'contains',target:testRecord.id},outside.id]});
 const parent=await update(request,milestone,{relationships:[{kind:'contains',target:scoped.id}]});
 await page.goto('/#/projects/'+project+'/increments');await page.getByRole('textbox',{name:'Search records'}).fill(scoped.title);await page.getByRole('link',{name:scoped.title,exact:true}).click();
 const panel=page.getByRole('region',{name:'Delivery increment scope'});await expect(panel.getByRole('link',{name:new RegExp(task.title)})).toBeVisible();await expect(panel.getByRole('link',{name:new RegExp(outside.title)})).toHaveCount(0);await expect(panel.getByText('No executable acceptance definition',{exact:true})).toBeVisible();await expect(panel.getByText('Local npm verification',{exact:true})).toBeVisible();await expect(panel.getByText('Browser regression',{exact:true})).toBeVisible();
 await panel.getByRole('link',{name:parent.title,exact:true}).click();await expect(page.getByRole('heading',{name:'Delivery increments',exact:true})).toBeVisible();await expect(page.locator('.increment-panel').getByRole('link',{name:new RegExp(scoped.title)})).toBeVisible();
});

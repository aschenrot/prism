import { test,expect } from '@playwright/test';
import { rename,readFile,writeFile,unlink } from 'node:fs/promises';
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
  const trigger=page.locator('.record-page').getByRole('button',{name:'Actions for '+record.title,exact:true});
  await trigger.click();
  const menu=page.getByRole('menu',{name:'Actions for '+record.title});
  await expect(menu).toBeVisible();
  // Reproduce a deferred navigation/scroll notification without moving the anchor.
  await page.evaluate(()=>window.dispatchEvent(new Event('scroll')));
  await expect(menu.getByRole('menuitem',{name:'Edit',exact:true})).toBeVisible();
  await menu.getByRole('menuitem',{name:'Edit',exact:true}).click();
  await expect(title(page)).toBeVisible();await title(page).fill('Dirty navigation title');
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
 const a=await create(request,'Dates Alpha'),b=await create(request,'Dates Beta');await update(request,a,{title:'Dates Alpha edited'});
 await page.goto('/#/projects/'+project+'/work');await page.getByRole('textbox',{name:'Search records'}).fill('Dates');const rows=page.locator('.record-table-title');await expect(rows).toHaveCount(2);
 const headers=page.locator('.records-table thead th');const widths=()=>headers.evaluateAll(nodes=>nodes.map(n=>{const rect=n.getBoundingClientRect();return [Math.round(rect.x*10),Math.round(rect.width*10)];}));
 const before=await widths();const titleSort=page.getByRole('button',{name:'Title',exact:true});
 await titleSort.click();await expect(rows).toHaveText(['Dates Alpha edited','Dates Beta']);expect(await widths()).toEqual(before);
 await titleSort.click();await expect(rows).toHaveText(['Dates Beta','Dates Alpha edited']);expect(await widths()).toEqual(before);
 // The delivery column must not reflow when asynchronously loaded evidence changes text.
 await page.locator('.records-table .delivery-cell').first().evaluate(node=>{node.textContent='History unavailable — a longer delivery evidence label';});expect(await widths()).toEqual(before);
 await page.getByRole('combobox',{name:'Sort by',exact:true}).selectOption('Created');await expect(page.getByRole('combobox',{name:'Sort direction'})).toHaveValue('Descending');const first=Date.parse(a.createdAt)<Date.parse(b.createdAt)?b.title:'Dates Alpha edited';await expect(rows.first()).toHaveText(first);
 await page.getByRole('combobox',{name:'Sort by',exact:true}).selectOption('Last edited');await expect(rows.first()).toHaveText('Dates Alpha edited');
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
 await open(page,source);await edit(page);const kind=page.getByRole('combobox',{name:'Relationship type',exact:true});await expect(kind).toBeVisible();await kind.selectOption('implements');
 const search=page.getByRole('searchbox',{name:'Search compatible records',exact:true}),select=page.getByRole('combobox',{name:'Target record',exact:true});await expect(search).toBeVisible();await expect(select).toBeVisible();
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
 await page.getByRole('button',{name:'Edit selected',exact:true}).click();const dialog=page.getByRole('dialog',{name:'Edit 3 selected records'});await expect(dialog).toBeVisible();const priority=dialog.getByRole('combobox',{name:'Priority',exact:true});await expect(priority).toBeVisible();await expect(dialog.getByRole('combobox',{name:'Status',exact:true})).toHaveValue('');await priority.selectOption('High');await dialog.getByRole('button',{name:'Apply changes'}).click();
 const result=page.getByRole('dialog',{name:'Bulk edit results'});await expect(result.getByText('2 confirmed · 1 not updated or unconfirmed')).toBeVisible();await expect(result.getByText(c.title,{exact:true})).toBeVisible();
 expect((await recordOnDisk(request,a.id)).priority).toBe('High');expect((await recordOnDisk(request,a.id)).status).toBe('In progress');expect((await recordOnDisk(request,b.id)).priority).toBe('High');expect((await recordOnDisk(request,b.id)).status).toBe('Concept');expect((await recordOnDisk(request,c.id)).priority).toBe('Normal');await result.getByRole('button',{name:'Done',exact:true}).click();
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

test('hosted verification is opt-in, revision-aware and does not retain a stale success on failure',async({page,request})=>{
 const unavailable=await request.post(prefix+'/hosted-verification',{data:{}});expect(unavailable.ok()).toBeTruthy();expect((await unavailable.json()).state).toBe('unavailable');
 const invalid=await request.post(prefix+'/hosted-verification',{data:{repository:'owner/other'}});expect(invalid.status()).toBe(400);
 await page.route('**/api/projects',async route=>{const response=await route.fetch();const items=await response.json();await route.fulfill({response,json:items.map(item=>item.id===project?{...item,githubRepository:'owner/project'}:item)});});
 let requests=0;
 const revision='a'.repeat(40);
 await page.route('**/api/projects/'+project+'/hosted-verification',async route=>{
  requests++;expect(route.request().method()).toBe('POST');expect(route.request().postDataJSON()).toEqual({});
  await route.fulfill({json:requests===1?{state:'available',repository:'owner/project',observedAt:'2026-11-24T10:00:00Z',total:1,runs:[{id:42,name:'Verify',branch:'main',head:revision,event:'pull_request',status:'completed',conclusion:'success',attempt:1,updatedAt:'2026-11-24T09:00:00Z',pullRequests:[13]}]}:{state:'unavailable',message:'GitHub access or anonymous rate limit reached. Try again later.'}});
 });
 await page.goto('/#/projects/'+project+'/quality');
 const panel=page.getByRole('region',{name:'Hosted verification'});await expect(panel.getByText(/Nothing loaded/)).toBeVisible();expect(requests).toBe(0);
 await panel.getByRole('button',{name:'Load GitHub runs'}).click();
 await expect(panel.getByRole('link',{name:'Verify · #42'})).toHaveAttribute('href','https://github.com/owner/project/actions/runs/42');
 await expect(panel.getByText(revision,{exact:true})).toBeVisible();
 await expect(panel.getByRole('link',{name:'#13'})).toHaveAttribute('href','https://github.com/owner/project/pull/13');
 await expect(panel.getByText(/not a verified job matrix/)).toBeVisible();
 await panel.getByRole('button',{name:'Refresh GitHub runs'}).click();
 await expect(panel.getByText(/anonymous rate limit reached/)).toBeVisible();await expect(panel.getByRole('link',{name:'Verify · #42'})).toHaveCount(0);expect(requests).toBe(2);
 await page.goto('/#/projects/'+other+'/quality');const otherPanel=page.getByRole('region',{name:'Hosted verification'});
 // The other fixture may use standalone storage, which intentionally has no repository panel.
 await expect(page.getByRole('heading',{name:'Quality',exact:true})).toBeVisible();
 if(await otherPanel.count())await expect(otherPanel.getByText(/No public GitHub repository configured/)).toBeVisible();
 expect(requests).toBe(2);
});

test('increment shows only explicitly associated PR runs and exact attempt job metadata',async({page,request})=>{
 const increment=await create(request,'Scoped hosted fixture','Increment');
 const file=join(process.env.PRISM_BROWSER_FIXTURE_ROOT,'repo','.prism','records',increment.id+'.md');
 await writeFile(file,(await readFile(file,'utf8')).replace(/^---\r?\n/,'---\ngithubPullRequests: [{repository: owner/project, number: 13}, {repository: other/project, number: 99}]\n'));
 const invalid=await request.post(prefix+'/hosted-jobs',{data:{runId:42,attempt:0}});expect(invalid.status()).toBe(400);
 await page.route('**/api/projects',async route=>{const response=await route.fetch();const items=await response.json();await route.fulfill({response,json:items.map(item=>item.id===project?{...item,githubRepository:'owner/project'}:item)});});
 let calls=0;
 const revision='a'.repeat(40),stamp='2026-11-24T10:00:00Z';
 await page.route('**/api/projects/'+project+'/records/'+increment.id+'/hosted-pull',async route=>{calls++;expect(route.request().postDataJSON()).toEqual({number:13});await route.fulfill({json:{state:'available',repository:'owner/project',observedAt:stamp,pull:{number:13,title:'Scoped PR',state:'open',draft:false,merged:false,head:revision,base:'b'.repeat(40),reportedMerge:null,updatedAt:stamp}}});});
 const run={id:42,name:'Scoped Verify',branch:'feature',head:revision,event:'pull_request',status:'completed',conclusion:'success',attempt:2,updatedAt:stamp,pullRequests:[13]};
 await page.route('**/api/projects/'+project+'/hosted-verification',async route=>{calls++;await route.fulfill({json:{state:'available',repository:'owner/project',observedAt:stamp,total:3,runs:[run,{...run,id:43,name:'Unrelated Verify',pullRequests:[99]},{...run,id:44,name:'Push Verify',event:'push'}]}});});
 await page.route('**/api/projects/'+project+'/hosted-jobs',async route=>{calls++;expect(route.request().postDataJSON()).toEqual({runId:42,attempt:2});await route.fulfill({json:{state:'available',repository:'owner/project',observedAt:stamp,runId:42,attempt:2,total:55,jobs:[{id:23,name:'verify matrix job',status:'completed',conclusion:'success',reportedHead:revision,startedAt:stamp,completedAt:stamp}]}});});
 await open(page,increment);const panel=page.getByRole('region',{name:'Hosted delivery evidence'});
 await expect(panel.getByRole('link',{name:'owner/project #13'})).toHaveAttribute('href','https://github.com/owner/project/pull/13');
 await expect(panel.getByText(/Reference does not match/)).toBeVisible();expect(calls).toBe(0);
 await panel.getByRole('button',{name:'Load PR',exact:true}).click();await expect(panel.getByText('Scoped PR',{exact:true})).toBeVisible();
 await panel.getByRole('button',{name:'Load associated runs'}).click();await expect(panel.getByRole('link',{name:'Scoped Verify · #42'})).toBeVisible();
 await expect(panel.getByText(/Unrelated Verify|Push Verify/)).toHaveCount(0);
 await panel.getByRole('button',{name:'Load jobs'}).click();await expect(panel.getByRole('link',{name:'verify matrix job'})).toBeVisible();
 await expect(panel.getByText(/Partial job list/)).toBeVisible();await expect(panel.getByText(/not actual checkout/)).toBeVisible();expect(calls).toBe(3);
 expect((await recordOnDisk(request,increment.id)).status).toBe('Concept');
});

test('schema-driven properties recover drafts and reject stale schema writes without losing values',async({page,request})=>{
 const schemaPath=join(process.env.PRISM_BROWSER_FIXTURE_ROOT,'repo','.prism','schema.yaml');
 const definition={version:1,fields:[{id:'effort',label:'Effort hours',kind:'number',appliesTo:['Task']},{id:'due',label:'Due date',kind:'date',appliesTo:['Task']},{id:'certainty',label:'Confidence',kind:'enum',options:[{id:'high',label:'High confidence'}]},{id:'reviewed',label:'Reviewed',kind:'boolean'},{id:'owner-note',label:'Owner note',kind:'text'},{id:'objective-ref',label:'Objective reference',kind:'reference',targetTypes:['Objective']}]};
 try{
  await writeFile(schemaPath,JSON.stringify(definition));
  const record=await create(request,'Schema fixture'),target=await create(request,'Schema target','Objective');
  const otherRecord=await create(request,'Other schema fixture','Task',other);
  const schema=await (await request.get(prefix+'/schema')).json();expect(schema.state).toBe('available');
  expect((await (await request.get('/api/projects/'+other+'/schema')).json()).configured).toBe(false);
  await open(page,record);await edit(page);
  await page.getByLabel('Effort hours',{exact:true}).fill('2.5');
  await page.getByLabel('Due date',{exact:true}).fill('2026-12-01');
  await page.getByLabel('Confidence',{exact:true}).selectOption('high');
  await page.getByLabel('Reviewed',{exact:true}).selectOption('no');
  await page.getByLabel('Owner note',{exact:true}).fill('Recover this property');
  await page.getByLabel('Objective reference',{exact:true}).selectOption(target.id);
  await keep(page).click();await page.reload();await page.getByRole('button',{name:'Resume draft'}).click();
  await expect(page.getByLabel('Effort hours',{exact:true})).toHaveValue('2.5');
  await expect(page.getByLabel('Owner note',{exact:true})).toHaveValue('Recover this property');
  const changed={...definition,fields:definition.fields.map(f=>f.id==='effort'?{...f,label:'Estimated hours'}:f)};
  await writeFile(schemaPath,JSON.stringify(changed));
  const stale=await request.put(prefix+'/records/'+record.id,{data:{expectedRevision:record.revision,expectedSchemaRevision:schema.revision,changes:{...editable(record),customProperties:{effort:7}}}});
  expect(stale.status()).toBe(422);expect((await recordOnDisk(request,record.id)).customProperties).toBeUndefined();
  await expect(page.getByRole('button',{name:'Review current schema'})).toBeVisible({timeout:12000});
  await expect(save(page)).toBeDisabled();await page.getByRole('button',{name:'Review current schema'}).click();
  await expect(page.getByLabel('Estimated hours',{exact:true})).toHaveValue('2.5');await save(page).click();
  await expect(page.getByText('Saved to disk',{exact:true})).toBeVisible();
  const saved=await recordOnDisk(request,record.id);
  expect(saved.customProperties).toEqual({effort:2.5,due:'2026-12-01',certainty:'high',reviewed:false,'owner-note':'Recover this property','objective-ref':target.id});
  await page.getByRole('button',{name:'Return to record',exact:true}).click();
  const panel=page.getByRole('region',{name:'Custom properties'});await expect(panel.getByText('High confidence',{exact:true})).toBeVisible();await expect(panel.getByText('Schema target',{exact:true})).toBeVisible();
  await open(page,otherRecord,other);await expect(page.getByRole('region',{name:'Custom properties'})).toHaveCount(0);
 }finally{await unlink(schemaPath).catch(()=>{});}
});

test('schema administration creates, renames and retires fields without rewriting saved values',async({page,request})=>{
 const schemaPath=join(process.env.PRISM_BROWSER_FIXTURE_ROOT,'other','schema.yaml'),otherPrefix='/api/projects/'+other;
 try{
  await page.goto('/#/projects/'+other+'/schemas');
  const panel=page.getByRole('region',{name:'Project schema administration'});
  await expect(panel.getByText(/No schema yet/)).toBeVisible();
  await panel.getByRole('button',{name:'New property'}).click();
  const form=panel.getByRole('form',{name:'Create property definition'});
  await form.getByLabel('Property ID',{exact:true}).fill('budget');
  await form.getByLabel('Property label',{exact:true}).fill('Budget');
  await form.getByLabel('Value kind',{exact:true}).selectOption('number');
  await page.getByRole('link',{name:'Work',exact:true}).click();
  await expect(form.getByLabel('Property label',{exact:true})).toHaveValue('Budget');
  await expect(page.getByText('Save or cancel the schema definition before navigating.',{exact:true})).toBeVisible();
  await form.getByRole('button',{name:'Save property'}).click();
  await expect(panel.getByText('Schema saved. Record values were not rewritten.')).toBeVisible();
  const schema=await (await request.get(otherPrefix+'/schema')).json();expect(schema.definition.fields[0].id).toBe('budget');
  expect((await (await request.get(prefix+'/schema')).json()).configured).toBe(false);
  const record=await create(request,'Schema admin record','Task',other);
  await open(page,record,other);await edit(page);await page.getByLabel('Budget',{exact:true}).fill('125');
  await save(page).click();await expect(page.getByText('Saved to disk',{exact:true})).toBeVisible();
  const saved=(await (await request.get(otherPrefix+'/records')).json()).records.find(r=>r.id===record.id);
  expect(saved.customProperties.budget).toBe(125);
  await page.getByRole('button',{name:'Return to record',exact:true}).click();
  await page.getByRole('link',{name:'Schemas',exact:true}).click();await panel.getByRole('button',{name:'Edit Budget',exact:true}).click();
  const editForm=panel.getByRole('form',{name:'Edit property definition'});
  await expect(editForm.getByLabel('Property ID',{exact:true})).toBeDisabled();
  await editForm.getByLabel('Property label',{exact:true}).fill('Project budget');
  await editForm.getByLabel('Retire property (preserve all values)',{exact:true}).check();
  await editForm.getByRole('button',{name:'Save property'}).click();
  await expect(panel.getByRole('button',{name:'Edit Project budget',exact:true})).toBeVisible();
  const current=(await (await request.get(otherPrefix+'/records')).json()).records.find(r=>r.id===record.id);expect(current.revision).toBe(saved.revision);
  await open(page,current,other);await expect(page.getByRole('region',{name:'Custom properties'}).getByText(/Preserved inactive value/)).toBeVisible();
  const rejected=await request.put(otherPrefix+'/schema',{data:{expectedRevision:schema.revision,definition:{version:1,fields:[]}}});expect(rejected.status()).toBe(409);
  const latest=await (await request.get(otherPrefix+'/schema')).json();expect(latest.definition.fields[0].retired).toBe(true);
  const removal=await request.put(otherPrefix+'/schema',{data:{expectedRevision:latest.revision,definition:{version:1,fields:[]}}});expect(removal.status()).toBe(422);
 }finally{await unlink(schemaPath).catch(()=>{});}
});

test('custom entity definitions retain built-in roles, scoped fields and collection filters',async({page,request})=>{
 const schemaPath=join(process.env.PRISM_BROWSER_FIXTURE_ROOT,'other','schema.yaml'),otherPrefix='/api/projects/'+other;
 try{
  await page.goto('/#/projects/'+other+'/schemas');
  const panel=page.getByRole('region',{name:'Project schema administration'}),entities=panel.getByRole('region',{name:'Custom entity definitions'});
  await entities.getByRole('button',{name:'New entity type'}).click();
  const form=entities.getByRole('form',{name:'Create entity definition'});
  await form.getByLabel('Entity ID',{exact:true}).fill('bug-report');
  await form.getByLabel('Entity label',{exact:true}).fill('Bug report');
  await form.getByLabel('Built-in role',{exact:true}).selectOption('Task');
  await form.getByRole('button',{name:'Save entity type'}).click();await expect(entities.getByRole('button',{name:'Edit entity Bug report'})).toBeVisible();
  await panel.getByRole('button',{name:'New property'}).click();
  const property=panel.getByRole('form',{name:'Create property definition'});
  await property.getByLabel('Property ID',{exact:true}).fill('severity');await property.getByLabel('Property label',{exact:true}).fill('Severity');
  await property.getByLabel('Value kind',{exact:true}).selectOption('number');
  await property.getByLabel('All compatible entities',{exact:true}).uncheck();await property.getByLabel('Bug report',{exact:true}).check();
  await property.getByRole('button',{name:'Save property'}).click();await expect(panel.getByRole('button',{name:'Edit Severity'})).toBeVisible();
  const bug=await create(request,'Custom entity bug','Task',other),plain=await create(request,'Custom entity plain','Task',other);
  await open(page,bug,other);await edit(page);await expect(page.getByLabel('Severity',{exact:true})).toHaveCount(0);
  await page.getByLabel('Custom entity type',{exact:true}).selectOption('bug-report');await page.getByLabel('Severity',{exact:true}).fill('4');
  await save(page).click();await expect(page.getByText('Saved to disk',{exact:true})).toBeVisible();
  const saved=(await (await request.get(otherPrefix+'/records')).json()).records.find(r=>r.id===bug.id);
  expect(saved.type).toBe('Task');expect(saved.customTypeId).toBe('bug-report');expect(saved.customProperties.severity).toBe(4);
  await page.getByRole('button',{name:'Return to record',exact:true}).click();await page.getByRole('link',{name:'Work',exact:true}).click();
  await page.getByRole('button',{name:'Filter',exact:true}).click();
  await page.getByLabel('Custom entity',{exact:true}).selectOption('bug-report');
  await expect(page.getByRole('link',{name:bug.title,exact:true})).toBeVisible();await expect(page.getByRole('link',{name:plain.title,exact:true})).toHaveCount(0);
  await page.getByRole('button',{name:'New Bug report',exact:true}).click();await page.getByLabel('Record title',{exact:true}).fill('Direct custom creation');await expect(page.getByLabel('Custom entity type',{exact:true})).toHaveValue('bug-report');await page.getByRole('button',{name:'Create',exact:true}).click();await expect(page.getByLabel('Title',{exact:true})).toHaveValue('Direct custom creation');await expect(page.getByLabel('Custom entity type',{exact:true})).toHaveValue('bug-report');await page.getByRole('button',{name:'Return to record',exact:true}).click();
  await page.getByRole('link',{name:'Schemas',exact:true}).click();await entities.getByRole('button',{name:'Edit entity Bug report'}).click();
  const editForm=entities.getByRole('form',{name:'Edit entity definition'});await expect(editForm.getByLabel('Built-in role',{exact:true})).toBeDisabled();await editForm.getByLabel('Retire entity type',{exact:true}).check();await editForm.getByRole('button',{name:'Save entity type'}).click();
  await expect(entities.getByText('Bug report · Retired',{exact:true})).toBeVisible();
  await open(page,saved,other);await expect(page.getByText(/Bug report · Task \(retired\)/)).toBeVisible();await expect(page.getByRole('region',{name:'Custom properties'}).getByText('4',{exact:true})).toBeVisible();
  await open(page,plain,other);await edit(page);await expect(page.getByLabel('Custom entity type',{exact:true})).toHaveCount(0);
 }finally{await unlink(schemaPath).catch(()=>{});}
});

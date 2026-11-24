import { test,expect } from '@playwright/test';
import { rename,readFile,writeFile,unlink,mkdir } from 'node:fs/promises';
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
  await page.getByRole('button',{name:'Return to record',exact:true}).click();await page.getByRole('navigation',{name:'Project navigation'}).getByRole('link',{name:'Work',exact:true}).click();
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

test('configurable table columns preserve order and values across saved views and schema retirement',async({page,request})=>{
 const schemaPath=join(process.env.PRISM_BROWSER_FIXTURE_ROOT,'other','schema.yaml'),otherPrefix='/api/projects/'+other;
 const definition={version:1,fields:[{id:'estimate',label:'Estimate',kind:'number',appliesTo:['Task']}]};
 try{
  await writeFile(schemaPath,JSON.stringify(definition));
  const record=await create(request,'Table estimate fixture','Task',other);
  const schema=await (await request.get(otherPrefix+'/schema')).json();
  const savedRecord=await request.put(otherPrefix+'/records/'+record.id,{data:{expectedRevision:record.revision,expectedSchemaRevision:schema.revision,changes:{...editable(record),customProperties:{estimate:42}}}});
  expect(savedRecord.ok()).toBeTruthy();
  await page.goto('/#/projects/'+other+'/work');
  const table=page.locator('.records-table');await expect(table.getByRole('columnheader',{name:'Status',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Columns',exact:true}).click();
  const settings=page.getByRole('region',{name:'Table columns'});
  await settings.getByRole('button',{name:'Hide Status',exact:true}).click();await expect(table.getByRole('columnheader',{name:'Status',exact:true})).toHaveCount(0);
  await settings.getByLabel('Add column',{exact:true}).selectOption('property:estimate');await settings.getByRole('button',{name:'Move Estimate up',exact:true}).click();
  const headers=()=>table.locator('thead th').allTextContents();
  await expect.poll(headers).toEqual(['','Title','Type','Estimate','Priority','Actions']);
  await expect(table.getByRole('row').filter({hasText:record.title}).getByText('42',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Saved views',exact:true}).click();
  await page.getByRole('button',{name:'Save current view',exact:true}).click();await page.getByLabel('View name',{exact:true}).fill('Estimates only');await page.getByRole('button',{name:'Save new view',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Estimates only',exact:true})).toBeVisible();
  await expect.poll(headers).toEqual(['','Title','Type','Estimate','Priority','Actions']);
  await page.reload();await expect.poll(headers).toEqual(['','Title','Type','Estimate','Priority','Actions']);
  await writeFile(schemaPath,JSON.stringify({...definition,fields:[{...definition.fields[0],label:'Estimated effort',retired:true}]}));
  await expect(table.getByRole('columnheader',{name:'Estimated effort (retired)',exact:true})).toBeVisible({timeout:12000});
  await expect(table.getByRole('row').filter({hasText:record.title}).getByText('42 (preserved)',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Columns',exact:true}).click();await settings.getByRole('button',{name:'Reset columns',exact:true}).click();
  await expect(table.getByRole('columnheader',{name:'Status',exact:true})).toBeVisible();
  await expect(page.getByText('Saved view modified — update to persist changes.')).toBeVisible();
 }finally{await unlink(schemaPath).catch(()=>{});}
});

test('project search finds saved records and local file content with provenance and preserves return context',async({page,request})=>{
 const fixture=process.env.PRISM_BROWSER_FIXTURE_ROOT,docs=join(fixture,'repo','docs');await mkdir(docs,{recursive:true});
 const file=join(docs,'search-fixture.md');await writeFile(file,'A documentation result for uniquefindmarker.');
 try{
  const target=await create(request,'Search target');await update(request,target,{body:'A saved record for uniquefindmarker.'});
  const otherTarget=await create(request,'Other project secret','Task',other);await update(request,otherTarget,{body:'uniquefindmarker'},other);
  await page.goto('/#/projects/'+project+'/library');await page.getByRole('button',{name:'Search',exact:true}).click();
  const panel=page.getByRole('region',{name:'Project search'});
  await panel.getByLabel('Search this project',{exact:true}).fill('uniquefindmarker');await panel.getByRole('button',{name:'Search project',exact:true}).click();
  await expect(panel.getByRole('link',{name:'Search target',exact:true})).toBeVisible();
  await expect(panel.getByText(/Body:.*uniquefindmarker/)).toBeVisible();
  await expect(panel.getByRole('link',{name:'Other project secret',exact:true})).toHaveCount(0);
  await panel.getByRole('button',{name:'docs/search-fixture.md',exact:true}).click();
  await expect(panel.getByRole('region',{name:'Search file preview'}).getByText('A documentation result for uniquefindmarker.',{exact:true})).toBeVisible();
  await panel.getByRole('link',{name:'Search target',exact:true}).click();await expect(page.getByRole('heading',{name:'Search target',exact:true})).toBeVisible();
  await page.goBack();await expect(panel.getByLabel('Search this project',{exact:true})).toHaveValue('uniquefindmarker');await expect(panel.getByRole('link',{name:'Search target',exact:true})).toBeVisible();
  const bad=await request.post(prefix+'/search',{data:{query:'x',root:fixture}});expect(bad.status()).toBe(400);
  await page.goto('/#/projects/'+other+'/library');await page.getByRole('button',{name:'Search',exact:true}).click();await panel.getByLabel('Search this project',{exact:true}).fill('uniquefindmarker');await panel.getByRole('button',{name:'Search project',exact:true}).click();
  await expect(panel.getByRole('link',{name:'Other project secret',exact:true})).toBeVisible();await expect(panel.getByRole('link',{name:'Search target',exact:true})).toHaveCount(0);await expect(panel.getByRole('heading',{name:/Repository files/})).toHaveCount(0);
 }finally{await unlink(file).catch(()=>{});}
});

test('templates initialize independent records and retirement prevents new use',async({page,request})=>{
 const otherPrefix='/api/projects/'+other;
 await page.goto('/#/projects/'+other+'/templates');
 const admin=page.getByRole('region',{name:'Project templates'});await admin.getByRole('button',{name:'New template',exact:true}).click();
 const form=admin.getByRole('form',{name:'Template definition'});
 await form.getByLabel('Template name',{exact:true}).fill('Review fixture template');
 await form.getByLabel('Default title',{exact:true}).fill('Review from template');
 await form.getByLabel('Default priority',{exact:true}).selectOption('High');
 await form.getByLabel('Default body',{exact:true}).fill('Template body');
 await form.getByRole('button',{name:'Save template',exact:true}).click();
 await expect(admin.getByText('Template saved. Existing records were not changed.')).toBeVisible();
 const t=(await (await request.get(otherPrefix+'/templates')).json()).templates.find(t=>t.name==='Review fixture template');
 await page.getByRole('navigation',{name:'Project navigation'}).getByRole('link',{name:'Work',exact:true}).click();
 await page.getByRole('button',{name:'New task',exact:true}).click();await page.getByLabel('Record template',{exact:true}).selectOption(t.id);
 await expect(page.getByLabel('Record title',{exact:true})).toHaveValue('Review from template');
 await page.getByRole('button',{name:'Create',exact:true}).click();
 await expect(page.getByLabel('Title',{exact:true})).toHaveValue('Review from template');
 await expect(page.locator('.editor textarea')).toHaveValue('Template body');
 const r=(await (await request.get(otherPrefix+'/records')).json()).records.find(r=>r.title==='Review from template');
 expect(r.status).toBe('Concept');expect(r.priority).toBe('High');expect(r.relationships).toEqual([]);
 const {id,version,revision,...values}=t;const retired=await request.put(otherPrefix+'/templates/'+id,{data:{expectedRevision:revision,template:{...values,retired:true}}});expect(retired.ok()).toBeTruthy();
 const retiredValue=await retired.json();const blocked=await request.post(otherPrefix+'/templates/'+id+'/instantiate',{data:{expectedRevision:retiredValue.revision,title:'Should not exist'}});expect(blocked.status()).toBe(409);
 expect((await (await request.get(otherPrefix+'/records')).json()).records.find(v=>v.id===r.id).body).toBe('Template body');
});

test('inbox capture is project-local and triage preserves canonical record identity',async({page,request})=>{
 const otherPrefix='/api/projects/'+other;
 await page.goto('/#/projects/'+other+'/inbox');
 const panel=page.getByRole('region',{name:'Project inbox'});
 await panel.getByLabel('Capture title',{exact:true}).fill('Capture fixture for triage');
 await panel.getByLabel('Notes',{exact:true}).fill('Keep this original note.');
 await page.getByRole('navigation',{name:'Project navigation'}).getByRole('link',{name:'Work',exact:true}).click();
 await expect(panel.getByLabel('Capture title',{exact:true})).toHaveValue('Capture fixture for triage');
 await panel.getByRole('button',{name:'Capture',exact:true}).click();
 const link=panel.getByRole('link',{name:'Capture fixture for triage',exact:true});
 await expect(link).toBeVisible();
 const captured=(await (await request.get(otherPrefix+'/records')).json()).records.find(r=>r.title==='Capture fixture for triage');
 expect(captured).toMatchObject({type:'Idea',status:'Concept',inbox:true,body:'Keep this original note.',relationships:[]});
 expect((await (await request.get(prefix+'/records')).json()).records.some(r=>r.id===captured.id)).toBe(false);
 await link.click();await expect(page.getByRole('heading',{name:captured.title,exact:true})).toBeVisible();
 await expect(page.getByText('Needs triage',{exact:true})).toBeVisible();
 await page.goBack();await expect(link).toBeVisible();
 await panel.getByRole('button',{name:'Finish triage for '+captured.title,exact:true}).click();
 await expect(link).toHaveCount(0);
 const saved=(await (await request.get(otherPrefix+'/records')).json()).records.find(r=>r.id===captured.id);
 expect(saved).toMatchObject({id:captured.id,title:captured.title,type:captured.type,status:captured.status,body:captured.body,inbox:false});
 const stale=await request.put(otherPrefix+'/records/'+captured.id+'/inbox',{data:{expectedRevision:captured.revision,inbox:true}});expect(stale.status()).toBe(409);
 await open(page,saved,other);await expect(page.getByRole('heading',{name:captured.title,exact:true})).toBeVisible();
 await expect(page.getByText('Needs triage',{exact:true})).toHaveCount(0);
});

test('board status moves use canonical revisions, keyboard control and recovery guards',async({page,request})=>{
 const a=await create(request,'Board move Alpha'),b=await create(request,'Board move Protected'),c=await create(request,'Board move Conflict');
 await open(page,b);await edit(page);await title(page).fill('Recover board draft');await keep(page).click();
 await page.goto('/#/projects/'+project+'/work');await page.getByRole('button',{name:'Board',exact:true}).click();
 await page.getByRole('textbox',{name:'Search records'}).fill('Board move');
 const board=page.getByRole('region',{name:'Status board'}),concept=board.getByRole('region',{name:'Concept column'}),progress=board.getByRole('region',{name:'In progress column'}),ready=board.getByRole('region',{name:'Ready column'});
 const move=name=>board.getByRole('combobox',{name:'Move '+name+' to status',exact:true});
 await expect(concept.getByRole('heading',{name:a.title,exact:true})).toBeVisible();
 await concept.locator('.board-card-shell').filter({has:page.getByRole('heading',{name:a.title,exact:true})}).locator('.board-grip').dragTo(progress.locator('.column-heading'));
 await expect(progress.getByRole('heading',{name:a.title,exact:true})).toBeVisible();expect((await recordOnDisk(request,a.id)).status).toBe('In progress');
 await move(a.title).focus();await move(a.title).selectOption('Ready');await expect(ready.getByRole('heading',{name:a.title,exact:true})).toBeVisible();await expect(move(a.title)).toBeFocused();
 await move(b.title).selectOption('Ready');await expect(page.getByText('Recovery draft or unavailable recovery storage; resolve it before editing.',{exact:true})).toBeVisible();expect((await recordOnDisk(request,b.id)).status).toBe('Concept');
 await page.route('**/api/projects/'+project+'/records/'+c.id+'/properties',async route=>{await update(request,c,{body:'External change'});await route.continue();},{times:1});
 await move(c.title).selectOption('Ready');await expect(page.getByText('Record changed on disk. Refresh before editing its properties.',{exact:true})).toBeVisible();const latest=await recordOnDisk(request,c.id);expect(latest.status).toBe('Concept');expect(latest.body).toBe('External change');
 await expect(page.getByRole('textbox',{name:'Search records'})).toHaveValue('Board move');
 await page.getByRole('textbox',{name:'Search records'}).fill(a.title);await page.getByRole('button',{name:'Filter',exact:true}).click();await page.getByLabel('Status',{exact:true}).selectOption('Ready');await move(a.title).focus();await move(a.title).selectOption('Concept');await expect(board.getByText('No matching records. Create a record or change your filters.',{exact:true})).toBeVisible();await expect(board).toBeFocused();
});

test('planning uses explicit dependency directions, shows filtered prerequisites and cycles, and retains navigation',async({page,request})=>{
 const a=await create(request,'Plan fixture prerequisite','Document'),b=await create(request,'Plan fixture task'),c=await create(request,'Plan fixture cycle A'),d=await create(request,'Plan fixture cycle B'),e=await create(request,'Plan fixture missing');
 await update(request,a,{status:'Ready',relationships:[{kind:'blocks',target:b.id}]});
 await update(request,b,{relationships:[{kind:'depends-on',target:a.id}]});
 await update(request,c,{relationships:[{kind:'depends-on',target:d.id}]});await update(request,d,{relationships:[{kind:'depends-on',target:c.id}]});
 await update(request,e,{relationships:[{kind:'depends-on',target:'missing-plan-fixture'}]});
 await page.goto('/#/projects/'+project+'/work');await page.getByRole('button',{name:'Plan',exact:true}).click();await page.getByRole('textbox',{name:'Search records'}).fill('Plan fixture');
 const panel=page.getByRole('region',{name:'Dependency planning'}),task=panel.getByRole('article',{name:'Dependencies for '+b.title});
 await expect(task.getByText('Direct prerequisites marked Ready',{exact:true})).toBeVisible();
 await expect(task.getByText('Direct prerequisites (1)',{exact:true})).toBeVisible();await expect(task.getByText('Outside current filter',{exact:true})).toBeVisible();
 await expect(panel.getByRole('article',{name:'Dependencies for '+c.title}).getByText('Dependency cycle',{exact:true})).toBeVisible();
 await expect(panel.getByRole('article',{name:'Dependencies for '+e.title}).getByText('Unavailable: missing-plan-fixture',{exact:true})).toBeVisible();
 await task.getByRole('link',{name:a.title,exact:true}).click();await expect(page.getByRole('heading',{name:a.title,exact:true})).toBeVisible();await page.goBack();
 await expect(panel).toBeVisible();await expect(page.getByRole('textbox',{name:'Search records'})).toHaveValue('Plan fixture');
 expect((await recordOnDisk(request,b.id)).status).toBe('Concept');
});

test('authored timeline maps stable date fields, persists saved mapping and exposes unplotted values',async({page,request})=>{
 const schemaPath=join(process.env.PRISM_BROWSER_FIXTURE_ROOT,'other','schema.yaml'),otherPrefix='/api/projects/'+other;
 const definition={version:1,fields:[{id:'start-date',label:'Start date',kind:'date'},{id:'end-date',label:'End date',kind:'date'}]};
 try{
 await writeFile(schemaPath,JSON.stringify(definition));const schema=await (await request.get(otherPrefix+'/schema')).json();
 const a=await create(request,'Timeline fixture range','Task',other),b=await create(request,'Timeline fixture undated','Task',other);
 const saved=await request.put(otherPrefix+'/records/'+a.id,{data:{expectedRevision:a.revision,expectedSchemaRevision:schema.revision,changes:{...editable(a),customProperties:{'start-date':'2026-12-01','end-date':'2026-12-08'}}}});expect(saved.ok()).toBeTruthy();
 await page.goto('/#/projects/'+other+'/work');await page.getByRole('button',{name:'Timeline',exact:true}).click();await page.getByRole('textbox',{name:'Search records'}).fill('Timeline fixture');
 const panel=page.getByRole('region',{name:'Authored timeline'});await panel.getByLabel('Date or start field',{exact:true}).selectOption('start-date');await panel.getByLabel('End field (optional)',{exact:true}).selectOption('end-date');
 await expect(panel.getByText('2026-12-01 – 2026-12-08',{exact:true})).toBeVisible();await expect(panel.getByRole('region',{name:'Unplotted records'}).getByRole('link',{name:b.title,exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Saved views',exact:true}).click();await page.getByRole('button',{name:'Save current view',exact:true}).click();await page.getByLabel('View name',{exact:true}).fill('Timeline fixture view');await page.getByRole('button',{name:'Save new view',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Timeline fixture view',exact:true})).toBeVisible();await page.reload();await expect(panel.getByLabel('Date or start field',{exact:true})).toHaveValue('start-date');await expect(panel.getByLabel('End field (optional)',{exact:true})).toHaveValue('end-date');
 await writeFile(schemaPath,JSON.stringify({...definition,fields:definition.fields.map(f=>f.id==='start-date'?{...f,retired:true}:f)}));
 await expect(panel.getByText('A selected date field is unavailable or retired. Review the mapping.',{exact:true})).toBeVisible({timeout:12000});
 const latest=(await (await request.get(otherPrefix+'/records')).json()).records.find(r=>r.id===a.id);expect(latest.customProperties['start-date']).toBe('2026-12-01');
 }finally{await unlink(schemaPath).catch(()=>{});}
});

test('record draft undo and redo preserve recovery and reset at canonical save boundaries',async({page,request})=>{
 const record=await create(request,'Draft history fixture');await open(page,record);await edit(page);
 const undo=page.getByRole('button',{name:'Undo draft edit',exact:true}),redo=page.getByRole('button',{name:'Redo draft edit',exact:true});
 await expect(undo).toBeDisabled();await title(page).fill('Edited draft title');await page.locator('.editor textarea').fill('Draft notes');
 await undo.click();await expect(page.locator('.editor textarea')).toHaveValue('');await expect(title(page)).toHaveValue('Edited draft title');
 await title(page).focus();await page.keyboard.press('Control+z');await expect(title(page)).toHaveValue(record.title);await expect(undo).toBeDisabled();await expect(redo).toBeEnabled();
 await redo.click();await expect(title(page)).toHaveValue('Edited draft title');await redo.click();await expect(page.locator('.editor textarea')).toHaveValue('Draft notes');
 await undo.click();await page.locator('.editor textarea').fill('Replacement notes');await expect(redo).toBeDisabled();
 expect((await recordOnDisk(request,record.id)).title).toBe(record.title);
 await keep(page).click();await page.reload();await page.getByRole('button',{name:'Resume draft'}).click();await expect(title(page)).toHaveValue('Edited draft title');await expect(page.locator('.editor textarea')).toHaveValue('Replacement notes');await expect(undo).toBeDisabled();
 await title(page).fill('Final title');await save(page).click();await expect(page.getByText('Saved to disk',{exact:true})).toBeVisible();await expect(undo).toBeDisabled();await expect(redo).toBeDisabled();expect((await recordOnDisk(request,record.id)).title).toBe('Final title');
});

test('opt-in autosave commits valid drafts and pauses on external conflict without retrying',async({page,request})=>{
 const r=await create(request,'Autosave fixture');await open(page,r);await edit(page);
 const toggle=page.getByRole('checkbox',{name:'Autosave valid changes',exact:true});
 await expect(toggle).not.toBeChecked();await title(page).fill('Autosave first draft');expect((await recordOnDisk(request,r.id)).title).toBe(r.title);
 await toggle.check();await expect(page.getByText('Autosaved to disk.',{exact:true})).toBeVisible();const first=await recordOnDisk(request,r.id);expect(first.title).toBe('Autosave first draft');
 await title(page).fill('');await expect(page.getByRole('alert').filter({hasText:/too small|at least|expected string/i})).toBeVisible();expect((await recordOnDisk(request,r.id)).title).toBe(first.title);
 await page.route('**/api/projects/'+project+'/records/'+r.id,async route=>{if(route.request().method()!=='PUT'){await route.continue();return;}await update(request,first,{body:'External autosave conflict'});await route.continue();},{times:1});
 await title(page).fill('Unsaved local after conflict');await expect(toggle).not.toBeChecked();
 await expect(page.getByText('Autosave paused: Save was not confirmed. Review the error before retrying.',{exact:true})).toBeVisible();
 await expect(title(page)).toHaveValue('Unsaved local after conflict');const latest=await recordOnDisk(request,r.id);expect(latest.title).toBe(first.title);expect(latest.body).toBe('External autosave conflict');
 await keep(page).click();await page.reload();await page.getByRole('button',{name:'Resume draft'}).click();await expect(toggle).not.toBeChecked();await expect(title(page)).toHaveValue('Unsaved local after conflict');
});

test('requirements traceability distinguishes explicit links from authored readiness and preserves context',async({page,request})=>{
 const req=await create(request,'Trace fixture requirement','Requirement'),gap=await create(request,'Trace fixture gap','Requirement'),implementation=await create(request,'Trace fixture task','Task'),testRecord=await create(request,'Trace fixture test','Test'),generic=await create(request,'Trace fixture generic','Task');
 await update(request,implementation,{relationships:[{kind:'implements',target:req.id}]});await update(request,testRecord,{status:'Ready',relationships:[{kind:'verifies',target:req.id}]});await update(request,generic,{relationships:[req.id]});
 await page.goto('/#/projects/'+project+'/requirements');await page.getByRole('button',{name:'Traceability',exact:true}).click();await page.getByRole('textbox',{name:'Search records'}).fill('Trace fixture');
 const panel=page.getByRole('region',{name:'Requirements traceability'}),row=panel.getByRole('row').filter({has:page.getByRole('link',{name:req.title,exact:true})});
 await expect(row.getByRole('link',{name:implementation.title,exact:true})).toBeVisible();await expect(row.getByRole('link',{name:testRecord.title,exact:true})).toBeVisible();await expect(row.getByRole('link',{name:generic.title,exact:true})).toHaveCount(0);
 await expect(panel.getByRole('columnheader',{name:'Test links (not results)',exact:true})).toBeVisible();
 const gapRow=panel.getByRole('row').filter({has:page.getByRole('link',{name:gap.title,exact:true})});await expect(gapRow.getByText('No explicit link',{exact:true})).toHaveCount(3);
 await row.getByRole('link',{name:implementation.title,exact:true}).click();await expect(page.getByRole('heading',{name:implementation.title,exact:true})).toBeVisible();await page.goBack();await expect(panel).toBeVisible();await expect(page.getByRole('textbox',{name:'Search records'})).toHaveValue('Trace fixture');
});

test('orphaned browser recovery is project scoped, exportable and never silently discarded',async({page,request})=>{
 const record=await create(request,'Recovery inventory fixture');await open(page,record);await edit(page);await title(page).fill('Unsaved orphan draft');await keep(page).click();
 const path=join(process.env.PRISM_BROWSER_FIXTURE_ROOT,'repo','.prism','records',record.id+'.md'),backup=path+'.test-backup';await rename(path,backup);
 try{
  await page.goto('/#/projects/'+project+'/recovery');const panel=page.getByRole('region',{name:'Browser recovery drafts'}),entry=panel.getByRole('article',{name:'Recovery for '+record.title,exact:true});
  await expect(entry.getByText('Canonical record unavailable',{exact:true})).toBeVisible();await expect(entry.getByRole('button',{name:'Review draft',exact:true})).toHaveCount(0);
  const [download]=await Promise.all([page.waitForEvent('download'),entry.getByRole('button',{name:'Export recovery',exact:true}).click()]);const exported=JSON.parse(await readFile(await download.path(),'utf8'));expect(exported.recordId).toBe(record.id);expect(exported.draft.title).toBe('Unsaved orphan draft');await expect(entry).toBeVisible();
  await page.goto('/#/projects/'+other+'/recovery');await expect(page.getByText('No recovery drafts for this project.',{exact:true})).toBeVisible();await expect(entry).toHaveCount(0);
 }finally{await rename(backup,path);}
 await page.goto('/#/projects/'+project+'/recovery');const entry=page.getByRole('article',{name:'Recovery for '+record.title,exact:true});await expect(entry.getByRole('button',{name:'Review draft',exact:true})).toBeVisible();await entry.getByRole('button',{name:'Review draft',exact:true}).click();await expect(title(page)).toHaveValue('Unsaved orphan draft');await keep(page).click();await page.goto('/#/projects/'+project+'/recovery');acceptDialog(page);await entry.getByRole('button',{name:'Discard recovery',exact:true}).click();await expect(entry).toHaveCount(0);expect((await recordOnDisk(request,record.id)).title).toBe(record.title);
});

test('record menu supports reversible inbox membership with draft protection',async({page,request})=>{
 const record=await create(request,'Inbox roundtrip fixture');await open(page,record);await edit(page);await title(page).fill('Retained inbox draft');await keep(page).click();
 await action(page,'Add to inbox',record.title);await expect(page.getByText('Recovery draft or unavailable recovery storage; resolve it before triage.',{exact:true})).toBeVisible();expect((await recordOnDisk(request,record.id)).inbox).not.toBe(true);
 await page.goto('/#/projects/'+project+'/recovery');const entry=page.getByRole('article',{name:'Recovery for '+record.title,exact:true});acceptDialog(page);await entry.getByRole('button',{name:'Discard recovery',exact:true}).click();await expect(entry).toHaveCount(0);
 await open(page,record);await action(page,'Add to inbox',record.title);await expect(page.getByText('Needs triage',{exact:true})).toBeVisible();expect((await recordOnDisk(request,record.id)).inbox).toBe(true);
 await page.goto('/#/projects/'+project+'/inbox');const panel=page.getByRole('region',{name:'Project inbox'});await expect(panel.getByRole('link',{name:record.title,exact:true})).toBeVisible();await panel.getByRole('link',{name:record.title,exact:true}).click();await edit(page);await title(page).fill('Keep pending triage draft');await keep(page).click();await page.goto('/#/projects/'+project+'/inbox');await panel.getByRole('button',{name:'Finish triage for '+record.title,exact:true}).click();await expect(panel.getByRole('alert')).toContainText('resolve it before triage');expect((await recordOnDisk(request,record.id)).inbox).toBe(true);
 await page.goto('/#/projects/'+project+'/recovery');acceptDialog(page);await entry.getByRole('button',{name:'Discard recovery',exact:true}).click();await expect(entry).toHaveCount(0);await open(page,record);await action(page,'Finish triage',record.title);await expect(page.getByText('Needs triage',{exact:true})).toHaveCount(0);const saved=await recordOnDisk(request,record.id);expect(saved.inbox).toBe(false);expect(saved.title).toBe(record.title);
});

test('unfinished schema entity and template definition forms recover after reload without canonical writes',async({page,request})=>{
 await page.goto('/#/projects/'+project+'/schemas');const panel=page.getByRole('region',{name:'Project schema administration'});
 await panel.getByRole('button',{name:'New property',exact:true}).click();await panel.getByLabel('Property ID',{exact:true}).fill('recovery-fixture-property');await panel.getByLabel('Value kind',{exact:true}).selectOption('enum');await panel.getByLabel('Option 1 ID',{exact:true}).fill('unfinished');
 await panel.getByRole('button',{name:'Keep property draft & close',exact:true}).click();await page.reload();await panel.getByRole('button',{name:'Resume property draft',exact:true}).click();await expect(panel.getByLabel('Property ID',{exact:true})).toHaveValue('recovery-fixture-property');await expect(panel.getByLabel('Option 1 ID',{exact:true})).toHaveValue('unfinished');await expect(panel.getByLabel('Property label',{exact:true})).toHaveValue('');
 const schema=(await (await request.get(prefix+'/schema')).json()).definition;expect(schema.fields.some(f=>f.id==='recovery-fixture-property')).toBe(false);acceptDialog(page);await panel.getByRole('form',{name:'Create property definition'}).getByRole('button',{name:'Cancel',exact:true}).click();
 const entity=panel.getByRole('region',{name:'Custom entity definitions'});await entity.getByRole('button',{name:'New entity type',exact:true}).click();await entity.getByLabel('Entity ID',{exact:true}).fill('recovery-fixture-entity');await entity.getByRole('button',{name:'Keep entity draft & close',exact:true}).click();await page.reload();await entity.getByRole('button',{name:'Resume entity draft',exact:true}).click();await expect(entity.getByLabel('Entity ID',{exact:true})).toHaveValue('recovery-fixture-entity');acceptDialog(page);await entity.getByRole('button',{name:'Cancel',exact:true}).click();
 await page.goto('/#/projects/'+project+'/templates');const templates=page.getByRole('region',{name:'Project templates'});await templates.getByRole('button',{name:'New template',exact:true}).click();await templates.getByLabel('Template name',{exact:true}).fill('Unfinished recovery template');await templates.getByLabel('Default body',{exact:true}).fill('Unsaved template notes');await templates.getByRole('button',{name:'Keep template draft & close',exact:true}).click();await page.reload();await templates.getByRole('button',{name:'Resume template draft',exact:true}).click();await expect(templates.getByLabel('Template name',{exact:true})).toHaveValue('Unfinished recovery template');await expect(templates.getByLabel('Default body',{exact:true})).toHaveValue('Unsaved template notes');expect((await (await request.get(prefix+'/templates')).json()).templates.some(t=>t.name==='Unfinished recovery template')).toBe(false);acceptDialog(page);await templates.getByRole('button',{name:'Cancel',exact:true}).click();
 await page.reload();await expect(templates.getByRole('button',{name:'Resume template draft',exact:true})).toHaveCount(0);
});

test('pull request associations are explicitly authored without remote calls and protect stale revisions',async({page,request})=>{
 const record=await create(request,'Association fixture','Increment');await open(page,record);const panel=page.getByRole('region',{name:'Pull request associations'});let remote=0;await page.route('**/api/projects/'+project+'/hosted-verification',async route=>{remote++;await route.abort();});await page.route('**/api/projects/'+project+'/records/'+record.id+'/hosted-pull',async route=>{remote++;await route.abort();});
 await panel.getByRole('button',{name:'Edit pull request associations',exact:true}).click();await panel.getByRole('button',{name:'Add association',exact:true}).click();await panel.getByLabel('Repository 1',{exact:true}).fill('example/project');await panel.getByLabel('PR number 1',{exact:true}).fill('42');await panel.getByRole('button',{name:'Save associations',exact:true}).click();await expect(panel.getByText('Pull request associations saved. No remote lookup was performed.',{exact:true})).toBeVisible();const saved=await recordOnDisk(request,record.id);expect(saved.githubPullRequests).toEqual([{repository:'example/project',number:42}]);expect(saved.status).toBe('Concept');expect(remote).toBe(0);
 await panel.getByRole('button',{name:'Edit pull request associations',exact:true}).click();await panel.getByLabel('PR number 1',{exact:true}).fill('43');const changed=await request.put(prefix+'/records/'+record.id+'/pull-references',{data:{expectedRevision:saved.revision,references:[{repository:'example/project',number:44}]}});expect(changed.ok()).toBeTruthy();await expect(panel.getByText('The saved associations changed. Export or cancel, then reopen the current references.',{exact:true})).toBeVisible();await expect(panel.getByRole('button',{name:'Save associations',exact:true})).toBeDisabled();await expect(panel.getByLabel('PR number 1',{exact:true})).toHaveValue('43');expect((await recordOnDisk(request,record.id)).githubPullRequests[0].number).toBe(44);expect(remote).toBe(0);acceptDialog(page);await panel.getByRole('button',{name:'Cancel associations',exact:true}).click();
});

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
async function edit(page){await page.getByRole('button',{name:'Edit record',exact:true}).click();await expect(page.getByLabel('Title',{exact:true})).toBeVisible();}
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
  await expect(page.getByRole('button',{name:'Edit record',exact:true})).toBeVisible();
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

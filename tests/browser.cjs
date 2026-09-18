const { chromium } = require('C:/Users/89227/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
(async()=>{
  const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--enable-unsafe-swiftshader']});
  const context=await browser.newContext({viewport:{width:1440,height:960},acceptDownloads:true});const page=await context.newPage();const errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
  await page.goto('http://127.0.0.1:5173');await page.locator('#graph canvas').waitFor();await page.waitForTimeout(1800);
  fs.mkdirSync('test-results',{recursive:true});await page.screenshot({path:'test-results/overview.png'});
  assert.equal(await page.locator('.plan-item').count(),20);
  await page.click('#clear-examples');assert.equal(await page.locator('.plan-item').count(),0);
  const date=await page.evaluate(()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;});
  async function create(title,type,parent){await page.click('#new-plan');await page.locator('[name=title]').fill(title);await page.locator('[name=type]').selectOption(type);await page.locator('[name=date]').fill(type==='month'?date.slice(0,7):date);if(parent)await page.locator('[name=parentId]').selectOption({label:parent});await page.locator('[name=notes]').fill('浏览器验收说明');await page.locator('[name=checklist]').fill('步骤一\n步骤二');await page.locator('button[type=submit]').click();await page.waitForFunction(()=>!document.querySelector('#editor').open);}
  await create('验收月目标','month');for(let i=1;i<=3;i++)await create(`验收日计划${i}`,'day','验收月目标');
  assert.equal(await page.locator('.plan-item').count(),4);
  await page.click('#toggle-done');await page.getByRole('button',{name:'验收月目标 月计划',exact:true}).click();assert.match(await page.locator('#detail').textContent(),/1 \/ 3/);
  await page.getByRole('button',{name:/验收日计划1/}).first().click();await page.click('#edit-plan');await page.locator('[name=title]').fill('修改后的日计划');await page.locator('button[type=submit]').click();
  await page.reload();await page.locator('.plan-item').first().waitFor();assert.equal(await page.locator('.plan-item').count(),4);assert.match(await page.locator('#plan-list').textContent(),/修改后的日计划/);
  const before=await page.evaluate(()=>localStorage.getItem('orbit-plans-v1'));
  await page.locator('#import-file').setInputFiles({name:'invalid.json',mimeType:'application/json',buffer:Buffer.from('{"version":1,"plans":[{}]}')});await page.waitForTimeout(200);assert.equal(await page.evaluate(()=>localStorage.getItem('orbit-plans-v1')),before);assert.match(await page.locator('#toast').textContent(),/导入失败/);
  const downloading=page.waitForEvent('download');await page.click('#export');const download=await downloading;await download.saveAs('test-results/backup.json');assert.equal(JSON.parse(fs.readFileSync('test-results/backup.json','utf8')).plans.length,4);
  await page.locator('#import-file').setInputFiles('test-results/backup.json');await page.waitForTimeout(200);assert.equal(await page.locator('.plan-item').count(),4);
  await page.getByRole('button',{name:'验收月目标 月计划',exact:true}).click();await page.click('#delete-plan');assert.equal(await page.locator('.plan-item').count(),3);assert.ok(JSON.parse(await page.evaluate(()=>localStorage.getItem('orbit-plans-v1'))).plans.every(p=>p.parentId===null));
  await page.click('#camera');await page.waitForFunction(()=>!document.querySelector('#camera').disabled,{},{timeout:60000});assert.match(await page.locator('#gesture-status').textContent(),/摄像头/);
  await page.getByRole('button',{name:/修改后的日计划/}).first().click();await page.screenshot({path:'test-results/detail.png'});
  await page.evaluate(()=>localStorage.setItem('orbit-plans-v1','BROKEN'));await page.reload();await page.locator('#new-plan').waitFor();await page.click('#new-plan');assert.equal(await page.locator('#editor').evaluate(e=>e.open),false);assert.equal(await page.evaluate(()=>localStorage.getItem('orbit-plans-v1')),'BROKEN');
  assert.deepEqual(errors,[]);console.log('Browser acceptance passed: CRUD, monthly progress, persistence, import/export, corruption protection, camera denial, no page errors.');
  await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});

const {chromium}=require('C:/Users/89227/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--enable-unsafe-swiftshader','--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']});
 try{const context=await browser.newContext({permissions:['camera'],viewport:{width:1440,height:960}});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:5173/nebula.html');await page.locator('#host canvas').waitFor();await page.waitForTimeout(1000);await page.screenshot({path:'test-results/nebula.png'});
 await page.fill('#search','首页');await page.locator('#results button').first().click();assert.match(await page.locator('#host-detail').textContent(),/首页/);
 await page.evaluate(async()=>{
   const {mountPlanGraph}=await import('/module-dist/plan-graph-module.js');const p={id:'m',title:'Host plan',type:'month',date:'2026-09',status:'pending'};
   const c=document.createElement('div');c.id='test-module';c.style.cssText='position:fixed;inset:0;width:640px;height:480px;z-index:50';document.body.append(c);
   window.events=[];window.cosmicEvents=[];window.mod=mountPlanGraph(c,{plans:[p],onSelect:p=>events.push(p),onCosmicSelect:e=>cosmicEvents.push(e)});
   p.title='mutation';if(mod.getPlans()[0].title!=='Host plan')throw Error('Caller data not isolated');
   const copy=mod.getPlans();copy[0].title='mutation';if(mod.getPlans()[0].title!=='Host plan')throw Error('Getter not isolated');
   const before=mod.getPlans();try{mod.setPlans([{id:'bad'}]);throw Error('Accepted invalid');}catch{}if(mod.getPlans()[0].id!==before[0].id)throw Error('Invalid update changed state');
   mod.select('m');if(events[0].id!=='m')throw Error('No selection callback');
   const n=mountPlanGraph(document.createElement('div'),{camera:false});n.destroy();n.destroy();
 });
 await page.waitForTimeout(500);
 assert.deepEqual(await page.evaluate(()=>mod.getCosmicObjects()),[]);
 const eventCount=await page.evaluate(()=>events.length);await page.mouse.click(20,20);await page.waitForTimeout(50);assert.equal(await page.evaluate(()=>events.length),eventCount);
 await page.evaluate(async()=>{mod.interactCosmic('comet-1');if(cosmicEvents.length)throw Error('Background emitted a cosmic event');await mod.startCamera();window.track=document.querySelector('#test-module').firstChild.shadowRoot.querySelector('video').srcObject.getTracks()[0];});
 await page.evaluate(()=>{mod.destroy();mod.destroy();if(track.readyState!=='ended')throw Error('Camera leaked');if(document.querySelector('#test-module').children.length)throw Error('DOM leaked');});
 assert.deepEqual(errors,[]);console.log('Module acceptance passed: render, host selection, background isolation, shadow isolation, atomic data updates, camera and repeated destroy.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});

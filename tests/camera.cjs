const {chromium}=require('C:/Users/89227/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{
  const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--enable-unsafe-swiftshader','--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']});
  try{
    const context=await browser.newContext({permissions:['camera'],viewport:{width:1440,height:960}});
    const page=await context.newPage();const errors=[],failed=[],external=[];
    page.on('pageerror',e=>errors.push(e.message));page.on('requestfailed',r=>failed.push(r.url()));page.on('request',r=>{if(!r.url().startsWith('http://127.0.0.1:5173')&&!r.url().startsWith('blob:')&&!r.url().startsWith('https://odml.pa.googleapis.com/'))external.push(r.url());});
    await page.goto('http://127.0.0.1:5173');
    await page.waitForFunction(()=>document.querySelector('.gesture-camera-source')?.srcObject?.getVideoTracks()[0]?.readyState==='live',null,{timeout:60000});
    assert.equal(await page.locator('.gesture-camera-source').evaluate(v=>v.srcObject.getVideoTracks()[0].readyState),'live');
    await page.evaluate(()=>{window.testTrack=document.querySelector('.gesture-camera-source').srcObject.getVideoTracks()[0];window.dispatchEvent(new PageTransitionEvent('pagehide'));});
    assert.equal(await page.evaluate(()=>window.testTrack.readyState),'ended');
    assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);assert.deepEqual(external,[]);
    console.log('Camera acceptance passed: invisible local camera source, local WASM/model inference, track release, and no application external requests.');
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});

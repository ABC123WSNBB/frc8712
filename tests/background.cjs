const {chromium}=require('C:/Users/89227/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--enable-unsafe-swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:960}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.route('**/favicon.ico',route=>route.fulfill({status:204}));
  await page.goto('http://127.0.0.1:5173/module-example.html');
  await page.evaluate(async()=>{
    const source=await (await fetch('/src/graph.js')).text();
    const threeUrl=source.match(/import \* as THREE from "([^"]+)"/)[1];
    const THREE=await import(threeUrl);
    const {createGraph}=await import('/src/graph.js');
    const add=THREE.Scene.prototype.add,update=THREE.PerspectiveCamera.prototype.updateMatrixWorld;
    let root,camera,selects=0;
    THREE.Scene.prototype.add=function(...objects){for(const o of objects)if(o.name==='decorative-background')root=o;return add.apply(this,objects);};
    THREE.PerspectiveCamera.prototype.updateMatrixWorld=function(...args){camera=this;return update.apply(this,args);};
    const host=document.createElement('div');host.style.cssText='position:fixed;inset:0;width:1000px;height:700px';document.body.append(host);
    let graph;
    try {graph=createGraph(host,()=>selects++,()=>{});}
    finally{THREE.Scene.prototype.add=add;THREE.PerspectiveCamera.prototype.updateMatrixWorld=update;}
    const tick=()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
    await new Promise(resolve=>setTimeout(resolve,200)); await tick();
    const planet=root.children[2],galaxy=root.children[3];
    const project=object=>{root.updateMatrixWorld(true);camera.updateMatrixWorld();return object.getWorldPosition(new THREE.Vector3()).project(camera);};
    const before=project(planet);
    graph.rotate(.9,.2);graph.zoom(.3);await tick();
    if(before.distanceTo(project(planet))>1e-5)throw Error('Background moved with plan camera');
    const fixed=planet.position.clone();planet.rotation.y+=1.2;planet.scale.setScalar(1.01);
    if(fixed.distanceTo(planet.position)>1e-8)throw Error('Planet pivot moved');
    for(const object of [planet,galaxy]){
      object.geometry.computeBoundingBox();
      if(object.geometry.boundingBox.getCenter(new THREE.Vector3()).length()>30)throw Error('Geometry not centered for self rotation');
    }
    const disposed=[];root.traverse(o=>{if(o.geometry)o.geometry.addEventListener('dispose',()=>disposed.push(o));});
    for(const layer of root.children){const p=project(layer);if(graph.pick((p.x+1)*500,(1-p.y)*350)!==null)throw Error('Background selected as plan');}
    graph.destroy();if(new Set(disposed).size!==6)throw Error('Background resources not disposed');
    if(selects)throw Error('Background triggered selection');host.remove();
  });
  assert.deepEqual(errors,[]);console.log('Background acceptance passed: fixed composition, local pivots, no hit targets, resource disposal, no console errors.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});

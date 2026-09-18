import test from 'node:test';
import assert from 'node:assert/strict';
import { validateDocument, seedPlans, progress, removePlan } from '../src/data.js';
import { GestureState } from '../src/gestures.js';

test('roundtrip, progress, parent removal and malformed imports',()=>{
  const plans=seedPlans();assert.deepEqual(validateDocument(JSON.parse(JSON.stringify({version:1,plans}))).plans,plans);
  const parent=plans.find(p=>p.type==='month');assert.equal(progress(parent,plans).total,4);assert.equal(progress(parent,plans).done,1);
  const completed=plans.map(p=>p.parentId===parent.id?{...p,status:'done'}:p);assert.equal(progress(parent,completed).percent,100);
  assert.equal(removePlan(plans,parent.id).filter(p=>p.parentId===parent.id).length,0);
  assert.equal(removePlan(plans,parent.id).length,plans.length-1);
  assert.throws(()=>validateDocument({version:2,plans}));assert.throws(()=>validateDocument({version:1,plans:[...plans,plans[0]]}));
  assert.throws(()=>validateDocument({version:1,plans:[{...plans[1],date:'2026-02-30'}]}));
  assert.throws(()=>validateDocument({version:1,plans:[{...plans[1],parentId:'missing'}]}));
  assert.throws(()=>validateDocument({version:1,plans:[{...plans[0],status:'toString'}]}));
});
const f=(pose,pinch=1,yaw=0,pitch=0)=>({pose,pinch,yaw,pitch});
const trend=(openness,pose='idle')=>({...f(pose),openness});
test('stable gesture activation, exclusive transitions, tracking loss and rebase',()=>{
  const s=new GestureState();assert.equal(s.step(f('rotate'),100).mode,'settling');
  assert.equal(s.step(f('rotate'),410).dx,undefined);assert.equal(s.step(f('rotate',1,.2),450).dx,.2);
  assert.equal(s.step(f('zoomIn'),460).mode,'settling');assert.equal(s.step(f('zoomIn'),800).mode,'zoomIn');
  assert.equal(s.step(null,810).mode,'lost');assert.equal(s.step(f('rotate',1,2),820).mode,'settling');assert.equal(s.step(f('rotate',1,2),1200).dx,undefined);
});
test('index pointing selects and pinch enters wrist rotation',()=>{
  const s=new GestureState();s.step(f('point'),1,'A');assert.equal(s.step(f('point'),500,'A').click,'A');
  assert.equal(s.step(f('idle',.3,0,0),600).mode,'pinch');
  assert.equal(s.step(f('idle',.3,.2,0),1000).mode,'pinchRotate');
  assert.equal(s.step(f('idle',.3,.3,0),1020).dx > 0,true);
  s.step(null,1100);assert.equal(s.step(f('point'),1200).click,undefined);
});
test('partial open and close trends control zoom modes',()=>{
  const s=new GestureState();assert.equal(s.step(trend(2.1),100).mode,'zoomIn');assert.equal(s.step(trend(2.0),500).mode,'zoomIn');assert.equal(s.step(trend(1.7),600).mode,'zoomOut');assert.equal(s.step(trend(1.0),1000).mode,'zoomOut');
});

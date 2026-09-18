import test from 'node:test';
import assert from 'node:assert/strict';
import { validateDocument, seedPlans, progress, removePlan } from '../src/data.js';

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

import test from 'node:test';
import assert from 'node:assert/strict';
import { GestureState, smoothFeatures } from '../src/gesture-state.js';
const f = (extra = {}) => ({ pose:'idle', pinch:1, openness:1.85, yaw:0, pitch:0, x:.5, y:.5, ...extra });
const point = f({pose:'point'});
const pinch = f({pinch:.3, openness:1.5});
const ready = () => { const s = new GestureState(); s.step(f(),0); s.step(f(),200); return s; };

test('dwell requires continuous pointing; rearming needs 200ms away', () => {
  const s = ready();
  s.step(point,300,'A'); s.step(f(),600,'A'); s.step(point,700,'A');
  assert.equal(s.step(point,1000,'A').click,undefined);
  assert.equal(s.step(point,1120,'A').click,'A');
  assert.equal(s.step(point,1600,'A').click,undefined);
  s.step(point,1700); s.step(point,1800,'A');
  assert.equal(s.step(point,2300,'A').click,undefined);
  s.step(point,2400); s.step(point,2600); s.step(point,2700,'A');
  assert.equal(s.step(point,3120,'A').click,'A');
});

test('pinch outranks zoom, locks recent target and opens only on stable release', () => {
  const s = ready(); s.step(point,300,'A');
  assert.equal(s.step(pinch,400).mode,'settling');
  assert.equal(s.step(pinch,480).mode,'pinch'); assert.equal(s.locked,'A');
  s.step(pinch,2400,'B'); // No 1.8 second timeout.
  assert.equal(s.step(f(),2500,'B').click,undefined);
  assert.equal(s.step(f(),2580,'B').click,'A');
  assert.equal(s.step(f(),2660,'B').click,undefined);
});

test('release debounce resets; expired targets and empty pinches never click/reset', () => {
  const s=ready();s.step(point,300,'A');s.step(pinch,600);s.step(pinch,680);
  s.step(f(),700);s.step(pinch,750);s.step(f(),800);
  const result=s.step(f(),880);assert.equal(result.click,undefined);assert.equal(result.reset,undefined);
});

test('turning cancels locked click even if wrist returns; tiny motion accumulates', () => {
  const s=ready();s.step(point,300,'A');s.step(pinch,400,'A');s.step(pinch,480);
  assert.equal(s.step(f({...pinch,yaw:.061}),500).mode,'pinchRotate');
  assert.equal(s.locked,null);
  s.step(f({...pinch,yaw:0}),600);
  s.step(f(),700);assert.equal(s.step(f(),780).click,undefined);
  const n=ready();n.step(f({pose:'rotate'}),300);n.step(f({pose:'rotate'}),600);
  let total=0;for(let i=1;i<=20;i++) total+=n.step(f({pose:'rotate',yaw:i*.003}),600+i*20).dx||0;
  assert.ok(total>.05 && total<=.061);
  assert.equal(n.step(f({pose:'rotate',yaw:.06}),1100).dx,0);
});

test('zoom dwell, asymmetric latency, hysteresis and immediate exit', () => {
  const s=ready();const open=f({openness:2}),closed=f({openness:1.6});
  assert.equal(s.step(open,300).mode,'settling');
  assert.equal(s.step(open,419).mode,'settling');
  assert.equal(s.step(open,420).mode,'zoomIn');
  assert.equal(s.step(f({openness:1.85}),500).mode,'zoomIn');
  assert.equal(s.step(f({openness:1.81}),520).mode,'idle');
  s.step(closed,600);assert.equal(s.step(closed,779).mode,'settling');
  assert.equal(s.step(closed,780).mode,'zoomOut');
  assert.equal(s.step(f({openness:1.79}),800).mode,'zoomOut');
  assert.equal(s.step(f({openness:1.81}),820).mode,'idle');
  assert.equal(s.step(pinch,840,'A').mode,'settling');
});

test('lost tracking clears locks and rebases after 200ms', () => {
  const s=ready();s.step(pinch,300,'A');s.step(pinch,380);
  assert.equal(s.step(null,400).mode,'lost');assert.equal(s.locked,null);
  assert.equal(s.step(f({...pinch,yaw:2}),500).mode,'settling');
  assert.equal(s.step(f({...pinch,yaw:2}),699).mode,'settling');
  s.step(f({...pinch,yaw:2}),700);assert.equal(s.step(f({...pinch,yaw:2}),780).dx,undefined);
  s.step(f({yaw:2}),800);assert.equal(s.step(f({yaw:2}),880).click,undefined);
});

test('15/30/60Hz have equivalent smoothing and rotation and bounded dwell latency', () => {
  const totals=[];
  for(const hz of [15,30,60]) {
    const dt=1/hz;let smoothed=f();
    for(let i=0;i<hz;i++)smoothed=smoothFeatures(smoothed,f({x:1}),dt);
    assert.ok(Math.abs(smoothed.x-(1-.5*Math.exp(-1/.07)))<1e-8);
    const s=ready();s.step(pinch,300);s.step(pinch,380);
    let total=0;
    for(let i=1;i<=hz*2;i++)total+=s.step(f({...pinch,yaw:i*dt*.1}),380+i*dt*1000).dx||0;
    totals.push(total);
    const p=ready();let clickedAt;
    for(let i=0;i<hz;i++){const t=300+i*1000/hz;if(p.step(point,t,'A').click)clickedAt=t;}
    assert.ok(clickedAt>=720 && clickedAt<=720+1000/hz+1);
  }
  assert.ok(Math.max(...totals)-Math.min(...totals)<.012);
});

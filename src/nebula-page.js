import { mountPlanGraph } from './module-entry.js';
import { seedPlans,STORAGE_KEY,validateDocument } from './data.js';
const $=s=>document.querySelector(s);
let plans;
try{const raw=localStorage.getItem(STORAGE_KEY);plans=raw?validateDocument(JSON.parse(raw)).plans:seedPlans();}catch{plans=seedPlans();}
const module=mountPlanGraph($('#host'),{plans,onSelect(plan){const detail=$('#host-detail');detail.replaceChildren();const h=document.createElement('h2');h.textContent=plan.title;const p=document.createElement('p');p.textContent=`${plan.date}\n${plan.notes||'把目标分成一个可以完成的小步骤。'}`;detail.append(h,p);},onStatus:status=>$('#status').textContent=status,onGesture:state=>{$('#status').textContent=({lost:'● 未检测到手 · 已暂停',point:'● 指向计划 · 停留打开',pinch:'● 捏合锁定 · 松开打开，转腕旋转',settling:'● 正在确认手势…',pinchRotate:'● 捏住转腕 · 旋转',zoomIn:'● 张开 · 放大',zoomOut:'● 收拢 · 缩小',rotate:'● 转腕 · 旋转'})[state.mode]||'● 手势已就绪';}});
$('#count').textContent=`${plans.length} 个计划 · 深空背景`;
$('#camera').onclick=async()=>{if($('#camera').dataset.active){module.stopCamera();delete $('#camera').dataset.active;$('#camera').textContent='启用手势';return;}$('#camera').disabled=true;try{await module.startCamera();$('#camera').dataset.active='1';$('#camera').textContent='关闭手势';}catch(e){$('#status').textContent=e.message;}finally{$('#camera').disabled=false;}};
$('#reset').onclick=()=>module.resetView();
$('#search').oninput=()=>{const query=$('#search').value.trim();$('#results').replaceChildren();if(!query)return;for(const plan of plans.filter(p=>p.title.includes(query)).slice(0,5)){const b=document.createElement('button');b.textContent=plan.title;b.onclick=()=>module.select(plan.id);$('#results').append(b);}};
window.addEventListener('pagehide',()=>module.destroy());

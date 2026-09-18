import './style.css';
import { STORAGE_KEY, today, seedPlans, validateDocument, progress, removePlan, visualState, statuses } from './data.js';
import { createGraph } from './graph.js';
import { createHandController, features, GestureState, smoothFeatures, GESTURE_RATES } from './gestures.js';

const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let plans=[],selected=null,hovered=null,filter='month',readOnly=false,initialError='';
try { const raw=localStorage.getItem(STORAGE_KEY); plans=raw===null?seedPlans():validateDocument(JSON.parse(raw)).plans; if(raw===null)localStorage.setItem(STORAGE_KEY,JSON.stringify({version:1,plans})); }
catch(error){readOnly=true;initialError='本地数据无法读取，已停止写入以保护原数据。请先导出原始备份，再导入有效文件。';}

$('#app').innerHTML=`
  <header><a class="brand" href="#" aria-label="轨迹首页"><span class="brand-icon">◎</span><span>轨迹<small>ORBIT / PERSONAL PLANNER</small></span></a><div class="top-caption">把每一个小计划，连接成你的未来。</div><div class="local-badge"><i></i> 本地保存 · 私人空间</div></header>
  <main><aside class="sidebar"><div class="eyebrow">YOUR CONSTELLATION</div><h1>计划有迹可循<span>让目标，慢慢成形。</span></h1><button class="primary" id="new-plan">＋ 新建计划</button>
    <div class="section-label">探索计划</div><nav><button class="nav active" data-filter="month">◉ 本月星图 <span id="month-count"></span></button><button class="nav" data-filter="today">◷ 今日待办 <span id="today-count"></span></button><button class="nav" data-filter="all">✧ 全部计划 <span id="all-count"></span></button></nav>
    <label class="month-picker">当前月份<input id="month" type="month" value="${today().slice(0,7)}" min="1900-01" max="9999-12"></label>
    <div class="section-label">计划索引 <span id="list-count"></span></div><div id="plan-list"></div><div class="data-tools"><button id="export">导出备份 ↗</button><button id="import">导入计划 ↙</button><input id="import-file" type="file" accept="application/json,.json" hidden><button id="clear-examples">清除示例</button></div>
  </aside><section class="universe" aria-label="三维计划网络"><div id="graph"></div><div class="scene-heading"><span class="eyebrow">A LITTLE PROGRESS, EVERY DAY</span><h2 id="scene-title">我的计划星球</h2><p id="scene-subtitle"></p></div><div class="scene-controls"><button id="reset-view" title="复位视角">⌖ 复位</button><button id="zoom-in" aria-label="放大">＋</button><button id="zoom-out" aria-label="缩小">−</button></div><div id="empty" hidden>这里还没有计划<span>创建第一个小目标，点亮你的星球。</span></div><div id="labels"></div><div id="hand-pointer" hidden></div><div class="scene-footer"><div class="legend"><span><i class="pending"></i>未开始</span><span><i class="active"></i>进行中</span><span><i class="done"></i>已完成</span><span><i class="overdue"></i>已逾期</span></div><p>拖动旋转 · 滚轮缩放 · 点击节点查看计划</p></div></section>
  <aside class="right"><section id="detail"></section><section class="gesture-panel"><div class="panel-title"><span>隔空交互</span><span class="beta">CAMERA</span></div><p class="muted">用手掌，转动你的计划星球。</p><button id="camera">启用摄像头</button><div id="gesture-status" role="status">摄像头未开启</div><div class="gesture-guide"><span>◡ 碗状手转腕</span><b>旋转</b><span>✋ 五指张开</span><b>放大</b><span>✊ 握拳</span><b>缩小</b><span>☝ 指向 · 捏合释放</span><b>打开</b></div><label class="sensitivity">灵敏度<input id="sensitivity" type="range" min="0.4" max="2" step="0.1" value="1"></label><label class="preview-toggle"><input id="show-preview" type="checkbox" checked> 显示摄像头预览</label><video id="preview" muted playsinline hidden></video><small class="privacy">画面仅在本机处理，不上传。</small></section></aside></main>
  <div id="toast" role="status" hidden></div><dialog id="editor"><form id="plan-form"><div class="panel-title"><h2 id="editor-title">新建计划</h2><button type="button" id="cancel-editor" aria-label="关闭编辑">×</button></div><label>计划名称<input name="title" required maxlength="100" placeholder="想要完成什么？"></label><div class="form-row"><label>计划类型<select name="type"><option value="day">日计划</option><option value="month">月计划</option></select></label><label>日期<input name="date" type="date" required></label></div><label id="parent-label">所属月计划<select name="parentId"></select></label><label>状态<select name="status"><option value="pending">未开始</option><option value="active">进行中</option><option value="done">已完成</option></select></label><small id="status-note" class="muted" hidden>此月计划有子计划，显示进度由子计划自动计算。</small><label>计划说明<textarea name="notes" rows="3" maxlength="20000" placeholder="给未来的自己留一点提示"></textarea></label><label>检查清单（每行一项）<textarea name="checklist" rows="3" placeholder="准备材料&#10;完成第一步"></textarea></label><p id="form-error" role="alert"></p><button class="primary" type="submit">保存计划</button></form></dialog>`;
let toastTimer;
function notify(message){$('#toast').textContent=message;$('#toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').hidden=true,6500);}
function save(next){
  if(readOnly){notify(initialError);return false;}
  try{const doc=validateDocument({version:1,plans:next});localStorage.setItem(STORAGE_KEY,JSON.stringify(doc));plans=doc.plans;render();return true;}catch(e){notify(`未保存：${e.message}`);return false;}
}
function visiblePlans(){return plans.filter(p=>filter==='all'||(filter==='today'?p.type==='day'&&p.date===today():p.date.slice(0,7)===$('#month').value));}
const graph=createGraph($('#graph'),select,id=>{hovered=id;graph.highlight(id||selected);});
function select(id){selected=id;graph.highlight(id);renderDetail();}
function render(){
  const visible=visiblePlans();
  if(!plans.some(p=>p.id===selected))selected=null;
  $('#month-count').textContent=plans.filter(p=>p.date.slice(0,7)===$('#month').value).length;
  $('#today-count').textContent=plans.filter(p=>p.type==='day'&&p.date===today()&&p.status!=='done').length;
  $('#all-count').textContent=plans.length;$('#list-count').textContent=visible.length;
  $('#scene-title').textContent=filter==='today'?'今天，向前一点':filter==='all'?'我的计划星球':`${Number($('#month').value.slice(5))} 月 · 计划星球`;
  const complete=visible.filter(p=>progress(p,plans).status==='done').length;
  $('#scene-subtitle').textContent=`${visible.length} 个计划 · ${complete} 个已完成${visible.some(p=>p.example)?' · 含示例数据':''}`;
  $('#plan-list').innerHTML=visible.length?visible.map(p=>`<button class="plan-item ${p.id===selected?'selected':''}" data-select="${esc(p.id)}"><i class="${visualState(p,plans)}"></i><span>${esc(p.title)}<small>${p.type==='month'?'月计划':p.date.slice(5)}${p.example?' · 示例':''}</small></span></button>`).join(''):'<p class="muted">还没有计划，开始点亮这里。</p>';
  $('#clear-examples').hidden=!plans.some(p=>p.example);
  $('#empty').hidden=visible.length>0;
  graph.update(visible,plans);graph.highlight(selected);renderDetail();
}
function renderDetail(){
  const p=plans.find(p=>p.id===selected);
  if(!p){$('#detail').innerHTML=`<div class="eyebrow">A SPACE FOR YOUR AMBITIONS</div><div class="detail-symbol">✧</div><h2>从一个小目标开始</h2><p class="muted intro">点亮一个节点，看看接下来要做的事。<br>每一次完成，都在让未来更清晰。</p><div class="overview"><strong>${plans.filter(p=>p.type==='day'&&p.status==='done').length}<small>已完成日计划</small></strong><strong>${plans.filter(p=>p.type==='month').length}<small>月度目标</small></strong></div>`;return;}
  const prog=progress(p,plans),children=plans.filter(q=>q.parentId===p.id),parent=plans.find(q=>q.id===p.parentId);
  $('#detail').innerHTML=`<div class="panel-title"><span class="eyebrow">${p.type==='month'?'MONTHLY OBJECTIVE':'DAILY INTENTION'}</span><button id="close-detail" aria-label="关闭详情">×</button></div><span class="status-tag ${visualState(p,plans)}">${visualState(p,plans)==='overdue'?'已逾期':statuses[prog.status]}${p.example?' · 示例':''}</span><h2 class="detail-title">${esc(p.title)}</h2><p class="muted">${esc(p.date)}${parent?` · ${esc(parent.title)}`:''}</p><p class="notes">${esc(p.notes)||'还没有说明，编辑计划添加一点想法。'}</p>${prog.total?`<div class="progress-caption"><span>计划进度</span><strong>${prog.done} / ${prog.total}</strong></div><progress max="100" value="${prog.percent}"></progress>`:''}<div class="checklist">${p.checklist.map((c,i)=>`<label><input type="checkbox" data-check="${i}" ${c.done?'checked':''}><span>${esc(c.text)}</span></label>`).join('')}</div>${children.length?`<div class="section-label">关联日计划</div>${children.map(c=>`<button class="child-plan" data-select="${esc(c.id)}"><i class="${visualState(c,plans)}"></i>${esc(c.title)}<span>↗</span></button>`).join('')}`:`<button id="toggle-done" class="primary">${p.status==='done'?'重新打开计划':'✓ 标记完成'}</button>`}<div class="detail-actions"><button id="edit-plan">编辑计划</button><button id="delete-plan" class="danger">删除</button></div>`;
}
let editing=null;
const form=$('#plan-form');
function updateForm(){
  const type=form.elements.type.value,month=type==='month';
  const previous=form.elements.date.value;form.elements.date.type=month?'month':'date';form.elements.date.value=month?(previous||today()).slice(0,7):previous.length===7?`${previous}-01`:previous||today();
  form.elements.date.min=month?'1900-01':'1900-01-01';form.elements.date.max=month?'9999-12':'9999-12-31';
  const chosen=form.elements.parentId.value;
  form.elements.parentId.innerHTML='<option value="">独立日计划</option>'+plans.filter(p=>p.type==='month'&&p.date===form.elements.date.value.slice(0,7)&&p.id!==editing).map(p=>`<option value="${esc(p.id)}">${esc(p.title)}</option>`).join('');
  form.elements.parentId.value=chosen;$('#parent-label').hidden=month;
}
function edit(id=null){
  if(readOnly){notify(initialError);return;}
  editing=id;const p=plans.find(p=>p.id===id);form.reset();$('#editor-title').textContent=p?'编辑计划':'新建计划';$('#form-error').textContent='';
  form.elements.title.value=p?.title||'';form.elements.type.value=p?.type||'day';form.elements.date.type=p?.type==='month'?'month':'date';form.elements.date.value=p?.date||today();
  form.elements.type.disabled=!!p&&plans.some(q=>q.parentId===p.id);form.elements.date.disabled=form.elements.type.disabled;
  form.elements.status.value=p?.status||'pending';form.elements.status.disabled=form.elements.type.disabled;$('#status-note').hidden=!form.elements.type.disabled;
  form.elements.notes.value=p?.notes||'';form.elements.checklist.value=p?.checklist.map(c=>c.text).join('\n')||'';updateForm();form.elements.parentId.value=p?.parentId||'';
  $('#editor').showModal();form.elements.title.focus();
}
form.elements.type.addEventListener('change',updateForm);form.elements.date.addEventListener('change',updateForm);
form.addEventListener('submit',e=>{
  e.preventDefault();const old=plans.find(p=>p.id===editing),type=form.elements.type.value;
  const checklist=form.elements.checklist.value.split('\n').map(x=>x.trim()).filter(Boolean).map((text,i)=>({text,done:old?.checklist[i]?.text===text?old.checklist[i].done:false}));
  const p={id:editing||crypto.randomUUID(),type,title:form.elements.title.value.trim(),date:form.elements.date.value,status:form.elements.status.value,notes:form.elements.notes.value,checklist,parentId:type==='day'?form.elements.parentId.value||null:null,example:false};
  try{validateDocument({version:1,plans:old?plans.map(q=>q.id===editing?p:q):[...plans,p]});}catch(err){$('#form-error').textContent=err.message;return;}
  if(save(old?plans.map(q=>q.id===editing?p:q):[...plans,p])){$('#editor').close();selected=p.id;render();notify('计划已保存');}
});
document.addEventListener('click',e=>{
  const node=e.target.closest('[data-select]');if(node){select(node.dataset.select);return;}
  const nav=e.target.closest('[data-filter]');if(nav){filter=nav.dataset.filter;document.querySelectorAll('.nav').forEach(n=>n.classList.toggle('active',n===nav));render();return;}
  switch(e.target.id){
    case 'new-plan':edit();break;
    case 'cancel-editor':$('#editor').close();break;
    case 'close-detail':selected=null;renderDetail();graph.highlight(null);break;
    case 'edit-plan':edit(selected);break;
    case 'delete-plan':if(confirm('删除此计划？所属日计划会保留，并解除关联。'))save(removePlan(plans,selected));break;
    case 'toggle-done':save(plans.map(p=>p.id===selected?{...p,status:p.status==='done'?'pending':'done'}:p));break;
    case 'clear-examples':if(confirm('清除全部示例计划？你自己创建或编辑的计划会保留。')){const ids=new Set(plans.filter(p=>p.example).map(p=>p.id));save(plans.filter(p=>!p.example).map(p=>ids.has(p.parentId)?{...p,parentId:null}:p));}break;
    case 'reset-view':graph.reset();break;
    case 'zoom-in':graph.zoom(-.15);break;
    case 'zoom-out':graph.zoom(.15);break;
  }
});
$('#detail').addEventListener('change',e=>{if(e.target.matches('[data-check]'))save(plans.map(p=>p.id===selected?{...p,checklist:p.checklist.map((c,i)=>i===Number(e.target.dataset.check)?{...c,done:e.target.checked}:c)}:p));});
$('#month').addEventListener('change',()=>{if(!$('#month').value)$('#month').value=today().slice(0,7);render();});
$('#export').onclick=()=>{
  let data;try{data=readOnly?localStorage.getItem(STORAGE_KEY):JSON.stringify({version:1,plans},null,2);}catch(e){notify(e.message);return;}
  const url=URL.createObjectURL(new Blob([data||''],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=`orbit-plans-${today()}${readOnly?'-raw':''}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
};
$('#import').onclick=()=>$('#import-file').click();
$('#import-file').onchange=async e=>{
  const file=e.target.files[0];if(!file)return;
  try{if(file.size>10*1024*1024)throw new Error('文件不能超过 10 MB。');const doc=validateDocument(JSON.parse(await file.text()));if(confirm(`导入 ${doc.plans.length} 个计划并替换当前数据？请确认已导出所需备份。`)){localStorage.setItem(STORAGE_KEY,JSON.stringify(doc));readOnly=false;plans=doc.plans;selected=null;render();notify('计划已导入');}}catch(err){notify(`导入失败，原数据未更改：${err.message}`);}finally{e.target.value='';}
};

const gestureNames={idle:'食指指向选择 · 拇指食指捏合转动',lost:'未检测到手，已暂停',settling:'正在确认手势…',rotate:'碗状手 · 仅转腕旋转',zoomIn:'五指张开 · 放大',zoomOut:'握拳 · 缩小',point:'食指指向 · 停留打开',pinch:'捏合锁定 · 松开打开，转腕旋转',pinchRotate:'捏住并转腕 · 旋转'};
const gesture=new GestureState();let smoothed=null,lastFrame=0;
const hand=createHandController({video:$('#preview'),onStatus:message=>{$('#gesture-status').textContent=message;if(!hand.active){$('#camera').textContent='启用摄像头';$('#preview').hidden=true;}},onFrame:points=>{
  const time=performance.now();const dt=Math.min((time-lastFrame)/1000,.07);lastFrame=time;
  if(!points){gesture.step(null,time);smoothed=null;hovered=null;graph.highlight(selected);$('#hand-pointer').hidden=true;$('#gesture-status').textContent=gestureNames.lost;return;}
  if($('#editor').open){gesture.reset();smoothed=null;$('#hand-pointer').hidden=true;$('#gesture-status').textContent='编辑计划中，手势已暂停';return;}
  const f=features(points,gesture.mode);smoothed=smoothFeatures(smoothed,f,dt);
  Object.assign(f,smoothed);const rect=$('#graph').getBoundingClientRect();const x=f.x*rect.width,y=f.y*rect.height;
  const result=gesture.step(f,time,graph.pick(x,y));$('#gesture-status').textContent=gestureNames[result.mode];
  const sensitivity=Number($('#sensitivity').value);
  if(result.mode==='zoomIn')graph.zoom(-dt * GESTURE_RATES.zoomIn*sensitivity);if(result.mode==='zoomOut')graph.zoom(dt * GESTURE_RATES.zoomOut*sensitivity);
  if((result.mode==='rotate'||result.mode==='pinchRotate')&&result.dx!==undefined)graph.rotate(-result.dx*sensitivity * GESTURE_RATES.rotation,result.dy*sensitivity * GESTURE_RATES.rotation);
  const pointing=['point','pinch','pinchRotate'].includes(result.mode);$('#hand-pointer').hidden=!pointing;
  if(pointing){$('#hand-pointer').style.left=`${x}px`;$('#hand-pointer').style.top=`${y}px`;$('#hand-pointer').classList.toggle('pinched',result.mode==='pinch'||result.mode==='pinchRotate');$('#hand-pointer').classList.toggle('rotating',result.mode==='pinchRotate');hovered=gesture.locked||graph.pick(x,y);graph.highlight(hovered||selected);}else if(hovered){hovered=null;graph.highlight(selected);}
  if(result.click){select(result.click);$('#gesture-status').textContent='已打开计划';}
}});
$('#camera').onclick=async()=>{
  if(hand.active){hand.stop();$('#camera').textContent='启用摄像头';$('#gesture-status').textContent='摄像头已关闭';$('#preview').hidden=true;return;}
  $('#camera').disabled=true;try{await hand.start();if(hand.active){$('#camera').textContent='关闭摄像头';$('#preview').hidden=!$('#show-preview').checked;}}catch{}finally{$('#camera').disabled=false;}
};
$('#show-preview').onchange=()=>$('#preview').hidden=!$('#show-preview').checked||!hand.active;
window.addEventListener('pagehide',()=>hand.stop());
document.addEventListener('visibilitychange',()=>{if(document.hidden&&hand.active){hand.stop();$('#camera').textContent='启用摄像头';$('#preview').hidden=true;$('#gesture-status').textContent='页面离开前台，摄像头已关闭';}});
document.addEventListener('keydown',e=>{if(e.target.closest('input,textarea,select,dialog'))return;if(e.key==='Escape'){selected=null;renderDetail();}if(e.key==='ArrowLeft')graph.rotate(-.08,0);if(e.key==='ArrowRight')graph.rotate(.08,0);if(e.key==='ArrowUp'){e.preventDefault();graph.rotate(0,-.08);}if(e.key==='ArrowDown'){e.preventDefault();graph.rotate(0,.08);}if(e.key==='+')graph.zoom(-.1);if(e.key==='-')graph.zoom(.1);});
let lastLabels=0;
function labels(time){
  if(time-lastLabels>80){lastLabels=time;const nodes=graph.nodes.filter(n=>n.type==='month'||n.id===selected||n.id===hovered).slice(0,20);$('#labels').innerHTML=nodes.map(n=>{const p=graph.project(n.id);if(!p||p.x<10||p.x>$('#graph').clientWidth-10||p.y<10||p.y>$('#graph').clientHeight-10)return '';return `<span class="node-label ${n.id===selected||n.id===hovered?'focused':''}" style="left:${p.x}px;top:${p.y+13}px">${esc(n.title)}</span>`;}).join('');}
  requestAnimationFrame(labels);
}
render();requestAnimationFrame(labels);if(initialError)notify(initialError);

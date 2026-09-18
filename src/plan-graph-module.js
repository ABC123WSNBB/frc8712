import { createGraph } from './graph.js';
import { createHandController, features, GestureState, smoothFeatures, GESTURE_RATES } from './gestures.js';
import { validateDocument } from './data.js';
import styles from './module.css?inline';

const DEFAULTS = { width: '100%', height: '100%', sensitivity: 1, showPointer: true, camera: true, modelAssetPath: '/mediapipe/hand_landmarker.task', wasmPath: '/mediapipe/wasm' };

/**
 * Mount the reusable 3D plan graph into a host-owned element.
 * The host owns plan data and details; this module owns rendering and gestures.
 */
export function mountPlanGraph(container, options = {}) {
  if (!(container instanceof HTMLElement)) throw new TypeError('mountPlanGraph requires an HTMLElement container.');
  const normalize=next=>validateDocument({version:1,plans:next.map(p=>({notes:'',checklist:[],parentId:null,status:'pending',...structuredClone(p)}))}).plans;
  let plans=normalize(options.plans||[]);
  const config = { ...DEFAULTS, ...options };
  const root = document.createElement('div'); root.style.width = config.width; root.style.height = config.height;
  const shadow=root.attachShadow({mode:'open'}),style=document.createElement('style');style.textContent=styles;
  const surface=document.createElement('div');surface.className='plan-graph-module';surface.tabIndex=0;surface.setAttribute('aria-label','可交互三维计划星云');shadow.append(style,surface);
  const graphHost = document.createElement('div'); graphHost.className = 'plan-graph-canvas';
  const pointer = document.createElement('div'); pointer.className = 'plan-graph-pointer'; pointer.hidden = true;
  const video = document.createElement('video'); video.className = 'plan-graph-video'; video.muted = true; video.playsInline = true; video.hidden = true;
  const labels=document.createElement('div');labels.className='plan-graph-labels';
  surface.append(graphHost, labels, pointer, video); container.append(root);

  let selected = null, hovered = null, destroyed = false, smoothed = null, lastFrame = 0;
  const gesture = new GestureState();
  const emit = (name, detail) => { options[name]?.(structuredClone(detail)); root.dispatchEvent(new CustomEvent(name, { detail:structuredClone(detail),bubbles:true,composed:true })); };
  const select=id=>{selected=id;graph.highlight(id);if(id)emit('onSelect',plans.find(p=>p.id===id));};
  const graph = createGraph(graphHost, select, id => { hovered = id; graph.highlight(id || selected); });
  const hand = config.camera ? createHandController({ video, modelAssetPath: config.modelAssetPath, wasmPath: config.wasmPath, onStatus: status => emit('onStatus', status), onFrame: points => {
    if (destroyed) return;
    const time = performance.now(), dt = Math.min((time - lastFrame) / 1000, .07); lastFrame = time;
    if (!points) { gesture.step(null, time); smoothed = null; pointer.hidden = true; hovered=null; graph.highlight(selected); emit('onGesture', { mode: 'lost' }); return; }
    const f = features(points, gesture.mode);
    smoothed = smoothFeatures(smoothed,f,dt);
    Object.assign(f, smoothed);
    const rect = graphHost.getBoundingClientRect(), x = f.x * rect.width, y = f.y * rect.height;
    const target=graph.pick(x,y);
    const result = gesture.step(f, time, target);
    const sensitivity = Number(config.sensitivity) || 1;
    if (result.mode === 'zoomIn') graph.zoom(-dt * GESTURE_RATES.zoomIn * sensitivity);
    if (result.mode === 'zoomOut') graph.zoom(dt * GESTURE_RATES.zoomOut * sensitivity);
    if ((result.mode === 'rotate' || result.mode === 'pinchRotate') && result.dx !== undefined) graph.rotate(-result.dx * sensitivity * GESTURE_RATES.rotation, result.dy * sensitivity * GESTURE_RATES.rotation);
    const pointing = ['point', 'pinch', 'pinchRotate'].includes(result.mode);
    pointer.hidden = !config.showPointer || !pointing;
    if (pointing) { pointer.style.left = `${x}px`; pointer.style.top = `${y}px`; pointer.classList.toggle('pinched', result.mode !== 'point'); hovered = gesture.locked || graph.pick(x, y); graph.highlight(hovered || selected); } else { hovered=null; graph.highlight(selected); }
    if (result.click && plans.some(p=>p.id===result.click)) select(result.click);
    emit('onGesture', { mode: result.mode, selected, pointer: { x, y } });
  }}) : null;

  const alive=()=>{if(destroyed)throw new Error('PlanGraphModule is destroyed.');};
  let labelsFrame,lastLabels=0;
  function drawLabels(time){if(destroyed)return;if(time-lastLabels>100){lastLabels=time;labels.replaceChildren();const entries=graph.nodes.filter(n=>n.type==='month'||n.id===selected||n.id===hovered).slice(0,20).map(n=>({...graph.project(n.id),title:n.title}));for(const item of entries){if(!Number.isFinite(item.x)||item.x<0||item.x>surface.clientWidth||item.y<0||item.y>surface.clientHeight)continue;const label=document.createElement('span');label.textContent=item.title;label.style.left=`${item.x}px`;label.style.top=`${item.y+17}px`;labels.append(label);}}labelsFrame=requestAnimationFrame(drawLabels);}labelsFrame=requestAnimationFrame(drawLabels);
  const events=new AbortController();
  document.addEventListener('visibilitychange',()=>{if(document.hidden)api.stopCamera();},{signal:events.signal});
  window.addEventListener('pagehide',()=>api.stopCamera(),{signal:events.signal});
  surface.addEventListener('keydown',e=>{const actions={ArrowLeft:()=>graph.rotate(-.08,0),ArrowRight:()=>graph.rotate(.08,0),ArrowUp:()=>graph.rotate(0,-.08),ArrowDown:()=>graph.rotate(0,.08),'+':()=>graph.zoom(-.1),'-':()=>graph.zoom(.1)};if(actions[e.key]){e.preventDefault();e.stopPropagation();actions[e.key]();}},{signal:events.signal});
  const api = {
    setPlans(next) { alive(); const validated=normalize(next);plans=validated;if(!plans.some(p=>p.id===selected))selected=null;gesture.reset();smoothed=null;hovered=null;pointer.hidden=true;graph.update(plans, plans);graph.highlight(selected);return api; },
    getPlans() { alive();return structuredClone(plans); },
    select(id) { alive();if(id!==null&&!plans.some(p=>p.id===id))throw new Error('Unknown plan ID');select(id);return api; },
    resetView() { alive();graph.reset();return api; },
    zoom(amount) { alive();if(!Number.isFinite(amount))throw new TypeError('Zoom must be finite');graph.zoom(amount);return api; },
    rotate(x,y) { alive();if(!Number.isFinite(x)||!Number.isFinite(y))throw new TypeError('Rotation must be finite');graph.rotate(x,y);return api; },
    getCosmicObjects(){alive();return graph.cosmicObjects;},
    interactCosmic(id){alive();graph.activateCosmic(id);return api;},
    async startCamera() { alive();if (!hand) throw new Error('Camera is disabled for this instance.'); await hand.start();if(!destroyed)video.hidden=!hand.active;return api; },
    stopCamera() { if(destroyed)return api;hand?.stop();video.hidden=true;pointer.hidden=true;return api; },
    destroy() { if(destroyed)return;destroyed=true;events.abort();cancelAnimationFrame(labelsFrame);hand?.destroy();graph.destroy();root.remove();emit('onDestroy',{}); }
  };
  api.setPlans(plans);
  return api;
}

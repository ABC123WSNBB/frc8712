import ForceGraph3D from '3d-force-graph';
import * as THREE from 'three';
import { visualState } from './data.js';

const colors = { pending: '#74bfff', active: '#ffcb79', done: '#72dec0', overdue: '#ff8e85' };
const PLANET_CENTER = new THREE.Vector3(155, 8, -255);

function makeGlowMap() {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 64;
  const context = canvas.getContext('2d'); const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, 'rgba(255,255,255,1)'); gradient.addColorStop(.15, 'rgba(255,255,255,.75)'); gradient.addColorStop(1, 'rgba(255,255,255,0)');
  context.fillStyle = gradient; context.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(canvas);
}

const pointVertex = `attribute float aSize;attribute float aPhase;attribute float aKind;attribute vec3 aColor;uniform float uTime;uniform float uScale;varying float vGlow;varying float vKind;varying vec3 vColor;void main(){vec4 mv=modelViewMatrix*vec4(position,1.0);vGlow=.76+.24*sin(uTime*(.28+aKind*.18)+aPhase);vKind=aKind;vColor=aColor;gl_PointSize=max(1.0,aSize*uScale/max(180.0,-mv.z));gl_Position=projectionMatrix*mv;}`;
const pointFragment = `precision highp float;uniform float uOpacity;varying float vGlow;varying float vKind;varying vec3 vColor;void main(){vec2 p=gl_PointCoord-.5;float d=length(p);float halo=smoothstep(.5,.08,d)*.25;float core=smoothstep(.15,0.,d);float rays=(smoothstep(.032,0.,abs(p.x))+smoothstep(.032,0.,abs(p.y)))*smoothstep(.45,.06,d)*vKind;float alpha=(halo+core+rays*.24)*vGlow*uOpacity;if(alpha<.008)discard;gl_FragColor=vec4(vColor*(.82+core*.58+rays*.2),alpha);}`;

function makePointLayer({ positions, colors, sizes, phases, kinds, opacity, scale = 420 }) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3)); geometry.setAttribute('aColor', new THREE.Float32BufferAttribute(colors, 3));
  geometry.setAttribute('aSize', new THREE.Float32BufferAttribute(sizes, 1)); geometry.setAttribute('aPhase', new THREE.Float32BufferAttribute(phases, 1)); geometry.setAttribute('aKind', new THREE.Float32BufferAttribute(kinds, 1));
  const material = new THREE.ShaderMaterial({ vertexShader: pointVertex, fragmentShader: pointFragment, uniforms: { uTime: { value: 0 }, uScale: { value: scale }, uOpacity: { value: opacity } }, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending });
  const points = new THREE.Points(geometry, material); points.frustumCulled = false; points.renderOrder = -10; return points;
}

function randomStarColor() { const tint = Math.random(); return tint < .12 ? new THREE.Color('#ffd7ae') : tint > .79 ? new THREE.Color('#a8d7ff') : new THREE.Color('#eef2ff'); }

function createFarStars(count) {
  const positions = [], colors = [], sizes = [], phases = [], kinds = [];
  for (let i = 0; i < count; i++) { const clustered = Math.random() < .35, lane = (Math.random() - .5) * 3000; positions.push(clustered ? lane + (Math.random() - .5) * 700 : (Math.random() - .5) * 3200, clustered ? lane * .13 + (Math.random() - .5) * 520 : (Math.random() - .5) * 1900, (Math.random() - .5) * 3000); const color = randomStarColor(), brightness = .58 + Math.random() * .34; colors.push(color.r * brightness, color.g * brightness, color.b * brightness); sizes.push(1 + Math.pow(Math.random(), 2.2) * 3.6); phases.push(Math.random() * Math.PI * 2); kinds.push(Math.random() < .045 ? 1 : 0); }
  return makePointLayer({ positions, colors, sizes, phases, kinds, opacity: .43 });
}

function createNebulaLanes(count) {
  const positions = [], colors = [], sizes = [], phases = [], kinds = [], palette = [new THREE.Color('#788fae'), new THREE.Color('#a39aae'), new THREE.Color('#6689a6')];
  for (let i = 0; i < count; i++) { const arm = i % 4, t = Math.random() * Math.PI * 1.85, radius = 125 + t * 96 + (Math.random() - .5) * 105, angle = t + arm * 1.48; positions.push(105 + Math.cos(angle) * radius, -8 + Math.sin(angle) * radius * .33 + (Math.random() - .5) * 46, -360 + Math.sin(angle) * radius * .26 + (Math.random() - .5) * 92); const color = palette[arm % palette.length], brightness = .34 + Math.random() * .36; colors.push(color.r * brightness, color.g * brightness, color.b * brightness); sizes.push(.7 + Math.random() * 1.7); phases.push(Math.random() * 6.28); kinds.push(0); }
  return makePointLayer({ positions, colors, sizes, phases, kinds, opacity: .22, scale: 340 });
}

function createParticlePlanet(count) {
  const positions = [], colors = [], sizes = [], phases = [], kinds = [], cool = new THREE.Color('#9eabc1'), violet = new THREE.Color('#a49aad'), gold = new THREE.Color('#ddca9a'); let placed = 0;
  while (placed < count) { const u = Math.random() * 2 - 1, angle = Math.random() * Math.PI * 2, latitude = Math.asin(u), longitudeNoise = Math.sin(angle * 4 + latitude * 3) * .22 + Math.sin(angle * 9 - latitude * 6) * .12, gap = Math.sin(angle * 3 - latitude * 2.4) + Math.sin(angle * 7 + latitude * 5.1), denseArc = Math.exp(-Math.pow(latitude + .15, 2) * 14) * (.45 + .55 * Math.sin(angle * 2 + .8) ** 2); if (gap < -1.12 && Math.random() < .76) continue; const radius = 132 + longitudeNoise * 20 + (Math.random() - .5) * 12 + denseArc * 9, x = Math.cos(latitude) * Math.cos(angle), y = Math.sin(latitude), z = Math.cos(latitude) * Math.sin(angle); positions.push(PLANET_CENTER.x + x * radius, PLANET_CENTER.y + y * radius * .92, PLANET_CENTER.z + z * radius); const selector = Math.random(), color = selector < .08 ? gold : selector < .48 ? violet : cool, edge = .55 + .45 * Math.abs(z), brightness = (.42 + Math.random() * .46 + denseArc * .22) * edge; colors.push(color.r * brightness, color.g * brightness, color.b * brightness); sizes.push(.9 + Math.pow(Math.random(), 1.9) * 3.6 + denseArc * 1.8); phases.push(angle * 2 + latitude * 3 + Math.random()); kinds.push(Math.random() < .025 ? 1 : 0); placed++; }
  const layer = makePointLayer({ positions, colors, sizes, phases, kinds, opacity: .82, scale: 680 });
  layer.geometry.translate(-PLANET_CENTER.x, -PLANET_CENTER.y, -PLANET_CENTER.z);
  layer.position.copy(PLANET_CENTER); return layer;
}

function createSpiralGalaxy(count) {
  const positions = [], colors = [], sizes = [], phases = [], kinds = [], center = new THREE.Vector3(385, -190, -455), blue = new THREE.Color('#778da8'), violet = new THREE.Color('#958aa4');
  for (let i = 0; i < count; i++) { const arm = i % 3, t = Math.pow(Math.random(), .63) * Math.PI * 3.25, radius = 10 + t * 19 + (Math.random() - .5) * 26, angle = t + arm * Math.PI * 2 / 3; positions.push(center.x + Math.cos(angle) * radius, center.y + Math.sin(angle) * radius * .31 + (Math.random() - .5) * 10, center.z + Math.sin(angle) * radius * .16); const color = Math.random() < .25 ? violet : blue, brightness = .3 + Math.random() * .35; colors.push(color.r * brightness, color.g * brightness, color.b * brightness); sizes.push(.6 + Math.random() * 1.7); phases.push(Math.random() * 6.28); kinds.push(0); }
  const layer = makePointLayer({ positions, colors, sizes, phases, kinds, opacity: .2, scale: 310 });
  layer.geometry.translate(-center.x, -center.y, -center.z); layer.position.copy(center); return layer;
}

function createComets() {
  const group = new THREE.Group(); group.renderOrder = -5;
  for (let i = 0; i < 2; i++) { const positions = [], colors = [], sizes = [], phases = [], kinds = []; for (let point = 0; point < 180; point++) { const distance = point * .46, spread = point / 180 * 7; positions.push(-360 + i * 300 - distance, 185 - i * 420 + Math.sin(distance * .05) * 22 + (Math.random() - .5) * spread, -160 - i * 140 + (Math.random() - .5) * spread); colors.push(.48, .75, .78); sizes.push(1.5 + (1 - point / 180) * 4); phases.push(point * .14); kinds.push(point < 5 ? 1 : 0); } const comet = makePointLayer({ positions, colors, sizes, phases, kinds, opacity: .48, scale: 390 }); comet.userData.speed = 4 + i * 1.5; group.add(comet); }
  return group;
}

export function createGraph(container, onSelect, onHover) {
  const graph = new ForceGraph3D(container, { controlType: 'orbit' }).backgroundColor('#020308').showNavInfo(false).nodeLabel(() => '').enableNodeDrag(false).cooldownTicks(0).linkOpacity(.36).linkWidth(.72).linkColor(() => '#557dba').onNodeClick(node => onSelect(node.id)).onNodeHover(node => onHover(node?.id || null));
  graph.renderer().setPixelRatio(Math.min(devicePixelRatio, 1.7)); graph.cameraPosition({ x: 0, y: 40, z: 540 }); const controls = graph.controls(); controls.enablePan = false; controls.minDistance = 230; controls.maxDistance = 1000; controls.enableDamping = false;
  const glowMap = makeGlowMap(); graph.nodeThreeObject(node => { const group = new THREE.Group(), color = colors[node.state], size = node.type === 'month' ? 3.5 : 1.8; group.renderOrder = 10; group.add(new THREE.Mesh(new THREE.SphereGeometry(size, 12, 12), new THREE.MeshBasicMaterial({ color, depthTest: false }))); const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowMap, color, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending })); glow.scale.setScalar(size * 9); group.add(glow); return group; });
  const pixels = container.clientWidth * container.clientHeight || 1440 * 960, quality = pixels < 700000 ? .65 : pixels > 2100000 ? .82 : 1, farStars = createFarStars(Math.round(3900 * quality)), nebulaLanes = createNebulaLanes(Math.round(4800 * quality)), planet = createParticlePlanet(Math.round(11000 * quality)), galaxy = createSpiralGalaxy(Math.round(2600 * quality)), comets = createComets(), backgroundLayers = [farStars, nebulaLanes, planet, galaxy, comets];
  const backdrop = new THREE.Group(); backdrop.name = 'decorative-background';
  backgroundLayers.forEach(layer => { layer.traverse(object => { object.raycast = () => {}; }); backdrop.add(layer); });
  graph.scene().add(backdrop);
  graph.camera().updateMatrixWorld();
  const initialCameraInverse = graph.camera().matrixWorld.clone().invert();
  const backdropTransform = new THREE.Matrix4();
  const syncBackdrop = () => {
    graph.camera().updateMatrixWorld();
    backdropTransform.multiplyMatrices(graph.camera().matrixWorld, initialCameraInverse).decompose(backdrop.position, backdrop.quaternion, backdrop.scale);
  };
  let frame = 0, lastTime = performance.now(), nodes = [];
  const animateBackground = now => { const dt = Math.min((now - lastTime) / 1000, .05), seconds = now / 1000; lastTime = now; syncBackdrop(); farStars.material.uniforms.uTime.value = seconds; nebulaLanes.material.uniforms.uTime.value = seconds + 1; planet.material.uniforms.uTime.value = seconds * .72; planet.rotation.y += dt * .008; planet.rotation.z = Math.sin(seconds * .11) * .018; planet.scale.setScalar(1 + Math.sin(seconds * .52) * .009); galaxy.material.uniforms.uTime.value = seconds * .5; galaxy.rotation.y += dt * .004; comets.children.forEach(comet => { comet.material.uniforms.uTime.value = seconds; comet.position.x = -490 + seconds * comet.userData.speed % 980; }); frame = requestAnimationFrame(animateBackground); }; frame = requestAnimationFrame(animateBackground);
  const observer = new ResizeObserver(() => { graph.width(container.clientWidth); graph.height(container.clientHeight); }); observer.observe(container);
  return {
    update(plans, allPlans) { const roots = plans.filter(plan => !plan.parentId || !plans.some(candidate => candidate.id === plan.parentId)), anchors = new Map(); roots.forEach((plan, index) => { const z = 1 - 2 * (index + .5) / Math.max(1, roots.length), angle = index * 2.3999632297; anchors.set(plan.id, new THREE.Vector3(Math.cos(angle) * Math.sqrt(1 - z * z), z, Math.sin(angle) * Math.sqrt(1 - z * z))); }); nodes = plans.map(plan => { let vector = anchors.get(plan.id); if (!vector) { const base = anchors.get(plan.parentId), siblings = plans.filter(candidate => candidate.parentId === plan.parentId), index = siblings.findIndex(candidate => candidate.id === plan.id), angle = index * 2.3999632297, spread = .19 + Math.sqrt(index) * .12, axis = Math.abs(base.y) > .9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0), u = new THREE.Vector3().crossVectors(base, axis).normalize(), w = new THREE.Vector3().crossVectors(base, u).normalize(); vector = base.clone().addScaledVector(u, Math.cos(angle) * spread).addScaledVector(w, Math.sin(angle) * spread).normalize(); } vector = vector.clone().multiplyScalar(142); return { id: plan.id, title: plan.title, type: plan.type, state: visualState(plan, allPlans), x: vector.x, y: vector.y, z: vector.z, fx: vector.x, fy: vector.y, fz: vector.z }; }); graph.graphData({ nodes, links: plans.filter(plan => plan.parentId && plans.some(candidate => candidate.id === plan.parentId)).map(plan => ({ source: plan.parentId, target: plan.id })) }); },
    highlight(id) { graph.linkColor(link => (link.source.id === id || link.target.id === id) ? '#ffca7f' : '#557dba'); graph.linkWidth(link => (link.source.id === id || link.target.id === id) ? 1.7 : .72); },
    project(id) { const node = nodes.find(candidate => candidate.id === id); if (!node) return null; const point = new THREE.Vector3(node.x, node.y, node.z).project(graph.camera()); return point.z < -1 || point.z > 1 ? null : graph.graph2ScreenCoords(node.x, node.y, node.z); },
    pick(x, y) { let best = null, distance = 58; for (const node of nodes) { const point = this.project(node.id); if (!point) continue; const candidate = Math.hypot(x - point.x, y - point.y); if (candidate < distance) { best = node.id; distance = candidate; } } return best; },
    zoom(amount) { const camera = graph.camera(); camera.position.multiplyScalar(Math.exp(amount)); camera.position.setLength(THREE.MathUtils.clamp(camera.position.length(), 230, 1000)); controls.update(); },
    rotate(dx, dy) { const camera = graph.camera(), spherical = new THREE.Spherical().setFromVector3(camera.position); spherical.theta += dx; spherical.phi = THREE.MathUtils.clamp(spherical.phi + dy, .15, Math.PI - .15); camera.position.setFromSpherical(spherical); controls.update(); },
    reset() { graph.cameraPosition({ x: 0, y: 40, z: 540 }, { x: 0, y: 0, z: 0 }, 600); }, get nodes() { return nodes; }, get cosmicObjects() { return []; }, pickCosmic() { return null; }, highlightCosmic() {}, activateCosmic() {},
    destroy() { observer.disconnect(); cancelAnimationFrame(frame); graph.pauseAnimation(); const resources = new Set(); graph.scene().traverse(object => { if (object.geometry) resources.add(object.geometry); for (const material of object.material ? (Array.isArray(object.material) ? object.material : [object.material]) : []) resources.add(material); }); resources.forEach(resource => resource.dispose()); glowMap.dispose(); graph._destructor(); graph.renderer().dispose(); graph.renderer().forceContextLoss(); container.replaceChildren(); }
  };
}

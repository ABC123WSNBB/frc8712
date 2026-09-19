import './style.css';
import { createGraph } from './graph.js';
import { createHandController, features, GestureState, smoothFeatures, GESTURE_RATES } from './gestures.js';

const app = document.querySelector('#app');
let scene = null;
let hand = null;
let destroyed = false;

function supportsWebGL() {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(window.WebGL2RenderingContext && canvas.getContext('webgl2', { failIfMajorPerformanceCaveat: true }));
  } catch {
    return false;
  }
}

function startGestureControl(graph) {
  const pointer = document.createElement('div');
  pointer.className = 'gesture-pointer';
  pointer.hidden = true;
  app.append(pointer);
  const preview = document.createElement('div');
  preview.className = 'camera-preview';
  const video = document.createElement('video');
  video.className = 'gesture-camera-source';
  video.muted = true;
  video.playsInline = true;
  video.setAttribute('aria-hidden', 'true');
  const toggle = document.createElement('button');
  toggle.className = 'camera-toggle';
  toggle.type = 'button';
  toggle.title = '显示摄像头预览';
  toggle.setAttribute('aria-label', '显示摄像头预览');
  toggle.setAttribute('aria-pressed', 'false');
  toggle.innerHTML = '<span aria-hidden="true"></span>';
  const setPreview = open => {
    preview.classList.toggle('is-open', open);
    toggle.setAttribute('aria-pressed', String(open));
    toggle.title = open ? '收起摄像头预览' : '显示摄像头预览';
    toggle.setAttribute('aria-label', toggle.title);
  };
  toggle.addEventListener('pointerdown', event => event.stopPropagation());
  toggle.addEventListener('click', event => {
    event.stopPropagation();
    setPreview(!preview.classList.contains('is-open'));
  });
  preview.append(video);
  app.append(preview, toggle);

  const state = new GestureState();
  let smoothed = null;
  let lastFrame = 0;
  hand = createHandController({
    video,
    onStatus: () => {},
    onFrame: points => {
      if (destroyed) return;
      const now = performance.now();
      const dt = Math.min((now - lastFrame) / 1000, .07);
      lastFrame = now;
      if (!points) {
        state.step(null, now);
        smoothed = null;
        pointer.hidden = true;
        graph.highlight(null);
        return;
      }

      const next = features(points, state.mode);
      smoothed = smoothFeatures(smoothed, next, dt);
      Object.assign(next, smoothed);
      const rect = app.getBoundingClientRect();
      const x = next.x * rect.width;
      const y = next.y * rect.height;
      const result = state.step(next, now, graph.pick(x, y));

      if (result.click !== undefined) graph.activateCosmic(result.click);

      if (result.mode === 'zoomIn') graph.zoom(-dt * GESTURE_RATES.zoomIn);
      if (result.mode === 'zoomOut') graph.zoom(dt * GESTURE_RATES.zoomOut);
      if ((result.mode === 'rotate' || result.mode === 'pinch' || result.mode === 'pinchRotate') && result.dx !== undefined) {
        const resistance = result.mode === 'pinch' || result.mode === 'pinchRotate' ? .62 : 1;
        graph.rotate(-result.dx * GESTURE_RATES.rotation * resistance, result.dy * GESTURE_RATES.rotation * resistance);
      }

      const pointing = ['point', 'pinch', 'pinchRotate'].includes(result.mode);
      pointer.hidden = !pointing;
      if (pointing) {
        pointer.style.left = `${x}px`;
        pointer.style.top = `${y}px`;
        pointer.classList.toggle('is-pinched', result.mode !== 'point');
      }
      graph.highlight(pointing ? state.locked ?? graph.pick(x, y) : null);
    }
  });

  // Request permission once while keeping the source hidden from the visual scene.
  hand.start().catch(() => {});
}

if (app && supportsWebGL()) {
  try {
    scene = createGraph(app, id => window.dispatchEvent(new CustomEvent('particle-project-open', { detail: { id } })));
    app.classList.add('scene-ready');
    startGestureControl(scene);
  } catch (error) {
    console.warn('3D background initialization failed; using the static fallback.', error);
    app.classList.add('scene-fallback');
  }
} else if (app) {
  app.classList.add('scene-fallback');
}

function release() {
  if (destroyed) return;
  destroyed = true;
  hand?.destroy();
  hand = null;
  scene?.destroy();
  scene = null;
}

window.addEventListener('pagehide', release, { once: true });
document.addEventListener('visibilitychange', () => {
  if (document.hidden) hand?.stop();
  else if (!destroyed && hand && !hand.active) hand.start().catch(() => {});
});

export const GESTURE_RATES = Object.freeze({ zoomIn: .38, zoomOut: .48, rotation: 1.7 });

export function smoothFeatures(previous, next, dt) {
  const result = { ...next };
  for (const key of ['x', 'y', 'yaw', 'pitch', 'openness']) {
    const tau = key === 'yaw' || key === 'pitch' ? .09 : .07;
    const alpha = 1 - Math.exp(-Math.max(0, dt) / tau);
    result[key] = previous ? previous[key] + (next[key] - previous[key]) * alpha : next[key];
  }
  return result;
}

export class GestureState {
  constructor() { this.reset(); }
  reset() {
    this.mode = 'idle'; this.readyAt = null; this.candidate = null; this.since = 0;
    this.pinched = false; this.pinchSince = null; this.releaseSince = null;
    this.locked = null; this.anchor = null; this.previous = null; this.turned = false;
    this.lastTarget = null; this.targetAt = -Infinity; this.pointTarget = null; this.pointSince = 0;
    this.fired = null; this.awaySince = null; this.pendingTarget = null;
  }
  emit(mode, extra = {}) { this.mode = mode; return { mode, ...extra }; }
  clearDwell() { this.pointTarget = null; this.pointSince = 0; }
  motion(f) {
    if (!this.previous) { this.previous = { yaw: f.yaw, pitch: f.pitch }; return {}; }
    const dx = f.yaw - this.previous.yaw, dy = f.pitch - this.previous.pitch;
    if (Math.hypot(dx, dy) < .008) return { dx: 0, dy: 0 };
    this.previous = { yaw: f.yaw, pitch: f.pitch };
    return { dx: Math.max(-.12, Math.min(.12, dx)), dy: Math.max(-.12, Math.min(.12, dy)) };
  }
  step(f, time, target = null) {
    if (!f) { this.reset(); return this.emit('lost'); }
    if (this.readyAt === null) this.readyAt = time;
    if (time - this.readyAt < 200) return this.emit('settling');

    if (this.fired) {
      if (target === this.fired) this.awaySince = null;
      else {
        this.awaySince ??= time;
        if (time - this.awaySince >= 200) { this.fired = null; this.awaySince = null; }
      }
    }
    if (this.pinched) {
      this.clearDwell();
      if (Math.hypot(f.yaw - this.anchor.yaw, f.pitch - this.anchor.pitch) > .06) {
        this.turned = true; this.locked = null;
      }
      if (f.pinch > .50) {
        this.releaseSince ??= time;
        if (time - this.releaseSince >= 80) {
          const click = !this.turned && this.locked !== this.fired ? this.locked : null;
          this.pinched = false; this.pinchSince = null; this.releaseSince = null;
          this.locked = null; this.anchor = null; this.previous = null; this.candidate = null;
          this.lastTarget = null; this.targetAt = -Infinity;
          if (click) { this.fired = click; this.awaySince = null; }
          return this.emit('idle', click ? { click } : {});
        }
        return this.emit(this.turned ? 'pinchRotate' : 'pinch');
      }
      this.releaseSince = null;
      return this.emit(this.turned ? 'pinchRotate' : 'pinch', this.motion(f));
    }
    // Reserve the whole pinch debounce interval so zoom or dwell cannot win it.
    if (f.pinch < .38) {
      if (this.pinchSince === null) {
        this.pinchSince = time;
        this.pendingTarget = target || (time - this.targetAt <= 200 ? this.lastTarget : null);
        this.anchor = { yaw: f.yaw, pitch: f.pitch };
      }
      this.clearDwell(); this.candidate = null;
      if (time - this.pinchSince < 80) return this.emit('settling');
      this.pinched = true; this.locked = this.pendingTarget; this.turned = false;
      this.previous = { ...this.anchor };
      return this.emit('pinch');
    }
    this.pinchSince = null;
    if (f.pose === 'point') {
      this.candidate = null; this.previous = null;
      if (target) {
        this.lastTarget = target; this.targetAt = time;
        if (this.pointTarget !== target) { this.pointTarget = target; this.pointSince = time; }
        if (time - this.pointSince >= 420 && target !== this.fired) {
          this.fired = target; this.awaySince = null;
          return this.emit('point', { click: target });
        }
      } else this.clearDwell();
      return this.emit('point');
    }
    this.clearDwell();
    let desired = 'idle';
    if (f.pose === 'rotate') desired = 'rotate';
    else if (this.mode === 'zoomIn' && f.openness > 1.82) desired = 'zoomIn';
    else if (this.mode === 'zoomOut' && f.openness < 1.80) desired = 'zoomOut';
    else if (f.openness > 1.90) desired = 'zoomIn';
    else if (f.openness < 1.72) desired = 'zoomOut';
    if (desired === 'idle') { this.candidate = null; this.previous = null; return this.emit('idle'); }
    if (desired !== this.candidate) { this.candidate = desired; this.since = time; this.previous = null; }
    const hold = desired === 'zoomIn' ? 120 : desired === 'zoomOut' ? 180 : 300;
    if (time - this.since < hold) return this.emit('settling');
    return this.emit(desired, desired === 'rotate' ? this.motion(f) : {});
  }
}

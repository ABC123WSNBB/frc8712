import { DIRS, TILE, clamp, moveWithCollision, centerOf } from "./core.js";

export class Tank {
  constructor({ x, y, type = "player", kind = "scout", color = "#58d1c9" }) {
    this.x = x; this.y = y; this.w = 28; this.h = 28; this.type = type; this.kind = kind; this.color = color;
    this.dir = "up"; this.aimDx = 0; this.aimDy = -1; this.turretAngle = -Math.PI / 2; this.hullAngle = -Math.PI / 2; this.baseSpeed = type === "player" ? 150 : ({ scout: 86, guard: 68, hunter: 104 }[kind] ?? 75); this.speed = this.baseSpeed;
    this.shieldCharges = 0; this.bombCharges = 0; this.rapidTimer = 0; this.speedTimer = 0; this.spreadTimer = 0; this.laserTimer = 0; this.freezeTimer = 0; this.invincibleTimer = 0; this.explosionTimer = 0;
    this.cooldown = 0; this.fireInterval = type === "player" ? 0.3 : 1.05; this.hp = kind === "guard" ? 2 : 1; this.maxHp = this.hp; this.aiTimer = 0; this.state = "patrol"; this.moveDir = "up";
  }
  updateCooldown(dt) { this.cooldown = Math.max(0, this.cooldown - dt); this.aiTimer -= dt; }
  updatePowerUps(dt) { this.rapidTimer = Math.max(0, this.rapidTimer - dt); this.speedTimer = Math.max(0, this.speedTimer - dt); this.spreadTimer = Math.max(0, this.spreadTimer - dt); this.laserTimer = Math.max(0, this.laserTimer - dt); this.freezeTimer = Math.max(0, this.freezeTimer - dt); this.invincibleTimer = Math.max(0, this.invincibleTimer - dt); this.explosionTimer = Math.max(0, this.explosionTimer - dt); }
  aim(direction) { if (DIRS[direction]) { this.dir = direction; this.aimVector(DIRS[direction].x, DIRS[direction].y); } }
  aimVector(dx, dy) {
    const length = Math.hypot(dx, dy); if (!length) return;
    this.aimDx = dx / length; this.aimDy = dy / length; this.turretAngle = Math.atan2(this.aimDy, this.aimDx);
    if (Math.abs(dx) >= Math.abs(dy)) this.dir = dx >= 0 ? "right" : "left"; else this.dir = dy >= 0 ? "down" : "up";
  }
  shoot(cooldownOverride = null) {
    if (this.cooldown > 0) return null;
    this.cooldown = cooldownOverride ?? (this.type === "player" ? (this.rapidTimer > 0 ? 0.14 : this.fireInterval) : this.fireInterval);
    const c = centerOf(this);
    return new Bullet(c.x - 3 + this.aimDx * 20, c.y - 3 + this.aimDy * 20, this.aimDx, this.aimDy, this.type, this.laserTimer > 0 ? "laser" : this.kind, this);
  }
  move(direction, dt, map) { this.aim(direction); const d = DIRS[direction]; return this.moveVector(d.x, d.y, dt, map); }
  moveVector(dx, dy, dt, map) {
    const length = Math.hypot(dx, dy) || 1;
    if (dx || dy) this.hullAngle = Math.atan2(dy, dx);
    // AI 的移动速度不因关卡或技能提高；速度技能仅影响玩家。
    const speed = this.speed * (this.type === "player" && this.speedTimer > 0 ? 1.45 : 1);
    return moveWithCollision(this, dx / length * speed * dt, dy / length * speed * dt, map);
  }
  draw(ctx) {
    const c = centerOf(this);
    if (this.explosionTimer > 0) return;
    ctx.save();
    ctx.translate(c.x, c.y);

    // 车体与炮台分别旋转：履带跟随移动方向，炮台只跟随瞄准方向。
    ctx.save();
    ctx.rotate(this.hullAngle);
    ctx.fillStyle = "#0d1519";
    ctx.fillRect(-15, -13, 30, 8);
    ctx.fillRect(-15, 5, 30, 8);
    ctx.fillStyle = "#30434a";
    ctx.fillRect(-13, -11, 26, 4);
    ctx.fillRect(-13, 7, 26, 4);
    ctx.fillStyle = "#7d9398";
    for (const wheelX of [-10, -3, 4, 11]) {
      ctx.beginPath(); ctx.arc(wheelX, -9, 2.3, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(wheelX, 9, 2.3, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = this.color;
    ctx.fillRect(-10, -6, 20, 12);
    ctx.fillStyle = this.type === "player" ? "#a8efe8" : "#f2ad80";
    ctx.fillRect(-7, -4, 14, 8);
    ctx.strokeStyle = "#091114";
    ctx.lineWidth = 2;
    ctx.strokeRect(-10, -6, 20, 12);
    ctx.restore();

    ctx.save();
    ctx.rotate(this.turretAngle);
    ctx.fillStyle = "#111b20";
    ctx.fillRect(3, -4, 22, 8);
    ctx.fillStyle = this.type === "player" ? "#d8fff0" : "#ffd2a5";
    ctx.fillRect(5, -2, 21, 4);
    ctx.fillStyle = "#0c1215";
    ctx.fillRect(23, -5, 4, 10);
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.moveTo(7, 0); ctx.lineTo(4, -8); ctx.lineTo(-5, -9); ctx.lineTo(-9, -4); ctx.lineTo(-9, 4); ctx.lineTo(-5, 9); ctx.lineTo(4, 8); ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#0b1417";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = this.type === "player" ? "#e8fffb" : "#ffe1c2";
    ctx.beginPath(); ctx.arc(-2, 0, 3, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    ctx.restore();
    if (this.shieldCharges > 0) { ctx.save(); ctx.strokeStyle = "#58d1c9aa"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(c.x, c.y, 21 + Math.sin(performance.now() / 140) * 2, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); }
    if (this.invincibleTimer > 0 && Math.floor(this.invincibleTimer * 12) % 2 === 0) { ctx.save(); ctx.strokeStyle = "#f8e6a3"; ctx.lineWidth = 3; ctx.setLineDash([4, 3]); ctx.beginPath(); ctx.arc(c.x, c.y, 24, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); }
    if (this.type === "enemy" && this.maxHp > 1) { ctx.fillStyle = "#11191d"; ctx.fillRect(this.x, this.y - 6, this.w, 3); ctx.fillStyle = "#f1a45d"; ctx.fillRect(this.x, this.y - 6, this.w * (this.hp / this.maxHp), 3); }
  }
}

export class Bullet {
  constructor(x, y, dx, dy, owner, kind, source = null) { this.x = x; this.y = y; this.w = kind === "laser" ? 5 : 4; this.h = kind === "laser" ? 5 : 4; this.dx = dx; this.dy = dy; this.owner = owner; this.kind = kind; this.source = source; this.speed = kind === "laser" ? 500 : (owner === "player" ? 340 : 230); this.speedScale = 1; this.life = kind === "laser" ? 3.2 : 2.5; this.age = 0; this.bounceCount = 0; this.maxBounces = kind === "laser" ? 1 : 3; }
  update(dt) { this.x += this.dx * this.speed * this.speedScale * dt; this.y += this.dy * this.speed * this.speedScale * dt; this.life -= dt; this.age += dt; }
  draw(ctx) { ctx.save(); ctx.fillStyle = this.owner === "player" ? (this.kind === "laser" ? "#b9fbff" : "#f8e6a3") : "#ff795e"; if (this.kind === "laser") { ctx.shadowColor = "#58d1c9"; ctx.shadowBlur = 10; } ctx.fillRect(this.x, this.y, this.w, this.h); ctx.restore(); }
}

export class Particle {
  constructor(x, y, color) { this.x = x; this.y = y; this.color = color; this.life = 0.55; this.max = this.life; this.vx = (Math.random() - .5) * 120; this.vy = (Math.random() - .5) * 120; this.size = 2 + Math.random() * 4; }
  update(dt) { this.x += this.vx * dt; this.y += this.vy * dt; this.life -= dt; }
  draw(ctx) { ctx.globalAlpha = clamp(this.life / this.max, 0, 1); ctx.fillStyle = this.color; ctx.fillRect(this.x, this.y, this.size, this.size); ctx.globalAlpha = 1; }
}

export class PowerUp {
  constructor(x, y, type) { this.x = x; this.y = y; this.w = 24; this.h = 24; this.type = type; this.life = 14; this.pulse = 0; }
  update(dt) { this.life -= dt; this.pulse += dt * 5; }
  draw(ctx) {
    const meta = { shield: ["#58d1c9", "S"], rapid: ["#f1c453", "R"], speed: ["#86d66f", ">"], spread: ["#d98cff", "W"], repair: ["#ef6b81", "+"], laser: ["#9ef5ff", "L"], bomb: ["#ff795e", "B"], freeze: ["#8cc7ff", "F"] }[this.type];
    const size = 13 + Math.sin(this.pulse) * 2; ctx.save(); ctx.translate(this.x + 12, this.y + 12); ctx.fillStyle = meta[0]; ctx.globalAlpha = .88; ctx.beginPath(); ctx.arc(0, 0, size, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; ctx.fillStyle = "#182229"; ctx.font = "800 15px ui-monospace, monospace"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(meta[1], 0, 1); ctx.restore();
  }
}

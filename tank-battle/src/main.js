import { COLS, DIRS, LEVELS, ROWS, SCORE, TILE, canOccupy, centerOf, clamp, destroyBrick, formatScore, isSolid, mapToTiles, measureDirectionClearance, rectsOverlap, scoreFor } from "./core.js";
import { Bullet, Particle, PowerUp, Tank } from "./entities.js";

const canvas = document.querySelector("#game"); const ctx = canvas.getContext("2d");
const screen = document.querySelector("#screen"); const screenTitle = document.querySelector("#screen-title"); const screenCopy = document.querySelector("#screen-copy"); const startButton = document.querySelector("#start-button");
const scoreEl = document.querySelector("#score"); const highScoreEl = document.querySelector("#high-score"); const livesEl = document.querySelector("#lives"); const enemiesEl = document.querySelector("#enemies"); const timeEl = document.querySelector("#time"); const levelEl = document.querySelector("#level"); const skillsEl = document.querySelector("#skills"); const strategyEl = document.querySelector("#ai-strategy");
const pauseButton = document.querySelector("#pause-button"); const soundButton = document.querySelector("#sound-button"); const introMusicButton = document.querySelector("#intro-music-button");

const keys = new Set(); let mouseFire = false; let pointer = { x: canvas.width / 2, y: 0 }; let map; let player; let enemies; let bullets; let particles; let powerUps; let score = 0; let highScore = Number(localStorage.getItem("sandstorm-high-score") || 0); let lives = 1; let levelDeaths = 0; let timeLeft = 90; let levelIndex = 0; let levelSkillDropped = false; let state = "menu"; let lastTime = 0; let soundOn = true;
const brandingImage = new Image(); brandingImage.src = "./assets/wavepeak-elite.jpg";
const menuMusic = new Audio("./assets/menu-music.mp3"); menuMusic.loop = true; menuMusic.autoplay = true; menuMusic.preload = "auto"; menuMusic.volume = 0.42;
const backgroundMusic = new Audio("./assets/background-music.mp3"); backgroundMusic.loop = true; backgroundMusic.volume = 0.32;
const victorySound = new Audio("./assets/victory-sound.mp3"); victorySound.loop = false; victorySound.volume = 0.58;
const defeatSound = new Audio("./assets/defeat-sound.mp3"); defeatSound.loop = false; defeatSound.volume = 0.58;
const ENEMY_SPAWNS = [
  [760, 80], [840, 240], [600, 80], [880, 440], [480, 80], [400, 440],
  [720, 440], [320, 80], [920, 280], [560, 440], [200, 240], [800, 560],
];
const DROP_POOL = ["shield", "rapid", "speed", "spread", "repair", "laser", "freeze", "bomb"];
let accumulatedDifficulty = 1;
const LEVEL_CONFIGS = Object.freeze(Array.from({ length: LEVELS.length }, (_, index) => {
  const special = [2, 5, 8, 9].includes(index);
  const enemyCount = 3 + index + Math.floor((index + 1) / 3) * 3;
  // 普通关策略成长 18%；第 3/6/9/10 关精确为上一关的 3/6/9/10 倍策略强度。
  if (index > 0) accumulatedDifficulty *= index === 2 ? 3 : index === 5 ? 6 : index === 8 ? 9 : index === 9 ? 10 : 1.18;
  const difficulty = accumulatedDifficulty;
  return {
    time: Math.max(42, 90 - index * 5), drops: DROP_POOL.slice(0, Math.min(DROP_POOL.length, 4 + Math.floor(index / 2))), special, difficulty,
    enemies: Array.from({ length: enemyCount }, (_, enemyIndex) => { const [x, y] = ENEMY_SPAWNS[enemyIndex % ENEMY_SPAWNS.length]; return { x, y, kind: ["scout", "guard", "hunter"][enemyIndex % 3] }; }),
  };
}));
const combatMemory = {
  moves: { up: 0, right: 0, down: 0, left: 0 },
  shots: { up: 0, right: 0, down: 0, left: 0 },
  lastMove: { x: 0, y: 0 },
  lastAim: { x: 0, y: -1 },
  exposure: 0,
};
try {
  const storedMemory = JSON.parse(localStorage.getItem("frc-ai-combat-memory") || "null");
  if (storedMemory?.moves && storedMemory?.shots) {
    Object.assign(combatMemory.moves, storedMemory.moves);
    Object.assign(combatMemory.shots, storedMemory.shots);
    combatMemory.exposure = Number(storedMemory.exposure) || 0;
  }
} catch { /* 损坏的本地战术记录会被安全忽略。 */ }
let memoryWritesPending = 0;
let activeStrategy = "知彼知己";
highScoreEl.textContent = formatScore(highScore);

function playBackgroundMusic() {
  if (!soundOn || state !== "playing") return;
  backgroundMusic.play().catch(() => {
    // 浏览器可能暂时阻止自动播放；开始按钮或音效按钮再次点击即可恢复。
  });
}
function pauseBackgroundMusic() { backgroundMusic.pause(); }
function playMenuMusic() {
  if (!soundOn || state !== "menu") return;
  menuMusic.play().then(() => {
    if (introMusicButton) introMusicButton.textContent = "暂停开场曲";
  }).catch(() => {
    // 浏览器禁止自动播放时，首次点击或按键会恢复开场音乐。
    if (introMusicButton) introMusicButton.textContent = "点击播放开场曲";
  });
}
function pauseMenuMusic() { menuMusic.pause(); }
function startGameMusicFromBeginning() {
  pauseMenuMusic();
  victorySound.pause(); victorySound.currentTime = 0;
  defeatSound.pause(); defeatSound.currentTime = 0;
  backgroundMusic.currentTime = 0;
  playBackgroundMusic();
}
function playVictorySound() {
  if (!soundOn) return;
  victorySound.currentTime = 0;
  victorySound.play().catch(() => {
    // 若浏览器拦截了非按钮触发的播放，下一次用户点击即可正常播放。
  });
}
function playDefeatSound() {
  if (!soundOn) return;
  defeatSound.currentTime = 0;
  defeatSound.play().catch(() => {
    // 若浏览器拦截了非按钮触发的播放，下一次用户点击即可正常播放。
  });
}
function saveCombatMemory(force = false) {
  memoryWritesPending += 1;
  if (!force && memoryWritesPending < 30) return;
  memoryWritesPending = 0;
  localStorage.setItem("frc-ai-combat-memory", JSON.stringify({ moves: combatMemory.moves, shots: combatMemory.shots, exposure: combatMemory.exposure }));
}
function rememberPlayerMove(dx, dy) {
  if (!dx && !dy) return;
  combatMemory.lastMove = { x: dx, y: dy };
  const direction = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : (dy > 0 ? "down" : "up");
  combatMemory.moves[direction] += 1;
  combatMemory.exposure = Math.min(1, combatMemory.exposure + 0.012);
  saveCombatMemory();
}
function rememberPlayerShot(dx, dy) {
  combatMemory.lastAim = { x: dx, y: dy };
  const direction = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : (dy > 0 ? "down" : "up");
  combatMemory.shots[direction] += 1;
  saveCombatMemory();
}
function predictedPlayerPoint(leadSeconds = 0.35) {
  const pc = centerOf(player);
  const move = combatMemory.lastMove;
  return { x: pc.x + move.x * player.speed * leadSeconds, y: pc.y + move.y * player.speed * leadSeconds };
}
function mostUsedDirection(counts) {
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "up";
}
function oppositeDirection(direction) { return { up: "down", down: "up", left: "right", right: "left" }[direction] ?? "down"; }
function perpendicularDirections(direction) { return direction === "up" || direction === "down" ? ["left", "right"] : ["up", "down"]; }
function selectSunTzuStrategy(enemy) {
  const moveTotal = Object.values(combatMemory.moves).reduce((sum, value) => sum + value, 0);
  const shotTotal = Object.values(combatMemory.shots).reduce((sum, value) => sum + value, 0);
  const preferredMoves = Math.max(...Object.values(combatMemory.moves));
  if (indexIsFinalBoss(levelIndex)) return "因敌制胜";
  if (enemy.isBoss && shotTotal > 80) return "避实击虚";
  if (enemy.isBoss) return "围师必阙";
  if (shotTotal > moveTotal * 0.45) return "以逸待劳";
  if (moveTotal > 100 && preferredMoves / moveTotal > 0.42) return "声东击西";
  return "知彼知己";
}
function indexIsFinalBoss(index) { return index === LEVELS.length - 1; }

function startLevel(index) {
  levelIndex = index; const config = LEVEL_CONFIGS[levelIndex]; map = mapToTiles(LEVELS[levelIndex]); player = new Tank({ x: 80, y: 520, type: "player", color: "#58d1c9" });
  const candidates = [];
  for (let row = 1; row < ROWS - 1; row += 1) for (let col = 1; col < COLS - 1; col += 1) {
    const x = col * TILE + 6; const y = row * TILE + 6;
    if (canOccupy(map, x, y, 28) && Math.hypot(x - 80, y - 520) > 150) candidates.push({ x, y });
  }
  const chosenSpawns = [];
  enemies = config.enemies.map(({ kind }, enemyIndex) => {
    let spawn = candidates.find((candidate) => chosenSpawns.every((taken) => Math.hypot(candidate.x - taken.x, candidate.y - taken.y) >= 34));
    if (!spawn) spawn = candidates[enemyIndex % candidates.length];
    chosenSpawns.push(spawn);
    const { x, y } = spawn;
    const isBoss = config.special && enemyIndex === 0;
    const enemy = new Tank({ x, y, type: "enemy", kind, color: isBoss ? "#ffcf6b" : kind === "scout" ? "#ef6b56" : kind === "guard" ? "#d47b50" : "#c65c60" });
    const strength = config.difficulty;
    enemy.isBoss = isBoss;
    enemy.aiTier = strength;
    // 敌人只通过战术学习变强，移动速度在所有关卡保持该兵种的固定基础值。
    enemy.speed = enemy.baseSpeed;
    enemy.fireInterval = Math.max(0.22, 1.18 / (0.72 + strength * 0.38));
    enemy.maxHp = enemy.hp = Math.max(1, Math.round(enemy.hp * Math.min(3.8, 0.78 + strength * 0.34) * (isBoss ? 2.2 : 1)));
    enemy.dodgeCooldown = 0;
    enemy.tacticalTimer = 0;
    enemy.stuckTimer = 0;
    enemy.escapeTimer = 0;
    enemy.lastMoveX = enemy.x;
    enemy.lastMoveY = enemy.y;
    enemy.strafeSign = enemyIndex % 2 ? 1 : -1;
    enemy.strategy = selectSunTzuStrategy(enemy);
    return enemy;
  });
  activeStrategy = enemies.find((enemy) => enemy.isBoss)?.strategy ?? enemies[0]?.strategy ?? "知彼知己";
  bullets = []; particles = []; powerUps = []; timeLeft = config.time; levelDeaths = 0; levelSkillDropped = false; state = "playing"; pauseButton.textContent = "暂停"; screen.classList.add("hidden"); updateHud();
}
function resetGame() { score = 0; lives = 1; combatMemory.lastMove = { x: 0, y: 0 }; combatMemory.lastAim = { x: 0, y: -1 }; startLevel(0); }
function updateHud() { scoreEl.textContent = formatScore(score); highScoreEl.textContent = formatScore(highScore); livesEl.textContent = String(lives).padStart(2, "0"); enemiesEl.textContent = String(enemies?.length ?? 0).padStart(2, "0"); timeEl.textContent = String(Math.max(0, Math.ceil(timeLeft))).padStart(2, "0"); if (levelEl) levelEl.textContent = `${levelIndex + 1} / ${LEVELS.length}`; if (strategyEl) strategyEl.textContent = activeStrategy; if (skillsEl && player) { const active = [["shieldCharges", "护盾×"], ["bombCharges", "炸弹×"], ["rapidTimer", "速射"], ["speedTimer", "加速"], ["spreadTimer", "散射"], ["laserTimer", "激光"], ["freezeTimer", "冻结"]].filter(([key]) => player[key] > 0).map(([key, label]) => key.endsWith("Timer") ? `${label} ${Math.ceil(player[key])}s` : `${label}${player[key]}`); skillsEl.textContent = active.length ? active.join(" · ") : "暂无技能"; } }
function addScore(value) { score += value; if (score > highScore) { highScore = score; localStorage.setItem("sandstorm-high-score", String(highScore)); } }
function showScreen(title, copy, button = "再战一次") { screenTitle.textContent = title; screenCopy.textContent = copy; startButton.textContent = button; if (introMusicButton) introMusicButton.hidden = state !== "menu"; screen.classList.remove("hidden"); }
function spawnParticles(x, y, color = "#f1a45d", amount = 12) { for (let i = 0; i < amount; i += 1) particles.push(new Particle(x, y, color)); }
function spawnPowerUp(x, y) { const types = LEVEL_CONFIGS[levelIndex].drops; const type = types[(levelIndex + enemies.length) % types.length]; powerUps.push(new PowerUp(clamp(x - 12, TILE + 4, canvas.width - TILE - 28), clamp(y - 12, TILE + 4, canvas.height - TILE - 28), type)); levelSkillDropped = true; }
function applyPowerUp(tank, powerUp) { const durations = { rapid: 10, speed: 9, spread: 10, laser: 8, freeze: 7 }; if (powerUp.type === "shield") tank.shieldCharges = 1; if (powerUp.type === "bomb") tank.bombCharges += 1; if (powerUp.type === "rapid") tank.rapidTimer = durations.rapid; if (powerUp.type === "speed") tank.speedTimer = durations.speed; if (powerUp.type === "spread") tank.spreadTimer = durations.spread; if (powerUp.type === "laser") tank.laserTimer = durations.laser; if (powerUp.type === "freeze") { if (tank.type === "player") enemies.forEach((enemy) => { enemy.freezeTimer = durations.freeze; }); else player.freezeTimer = durations.freeze; } if (powerUp.type === "repair") { if (tank.type === "player") lives += 1; else tank.hp = Math.min(tank.maxHp, tank.hp + 1); } if (tank.type === "player") addScore(SCORE.bonus); spawnParticles(powerUp.x + 12, powerUp.y + 12, tank.type === "player" ? "#f8e6a3" : "#ef6b56", 14); }

function updatePlayer(dt) {
  player.updateCooldown(dt); player.updatePowerUps(dt);
  if (player.explosionTimer > 0) return;
  const dx = (keys.has("ArrowRight") || keys.has("d") ? 1 : 0) - (keys.has("ArrowLeft") || keys.has("a") ? 1 : 0);
  const dy = (keys.has("ArrowDown") || keys.has("s") ? 1 : 0) - (keys.has("ArrowUp") || keys.has("w") ? 1 : 0);
  const center = centerOf(player); player.aimVector(pointer.x - center.x, pointer.y - center.y);
  if (player.freezeTimer > 0) return;
  if (dx || dy) { rememberPlayerMove(dx, dy); player.moveVector(dx, dy, dt, map); }
  if (keys.has(" ") || mouseFire) fireTank(player);
}

function fireTank(tank) {
  const bullet = tank.shoot(); if (!bullet) return;
  if (tank === player) rememberPlayerShot(bullet.dx, bullet.dy);
  bullets.push(bullet);
  if (tank.spreadTimer > 0) for (const angle of [-0.24, 0.24]) { const cos = Math.cos(angle); const sin = Math.sin(angle); const dx = bullet.dx * cos - bullet.dy * sin; const dy = bullet.dx * sin + bullet.dy * cos; const c = centerOf(tank); bullets.push(new Bullet(c.x - 2 + dx * 20, c.y - 2 + dy * 20, dx, dy, tank.type, "spread", tank)); }
}
function useBomb() {
  if (!player || player.bombCharges <= 0 || state !== "playing") return;
  player.bombCharges -= 1; const pc = centerOf(player); enemies.slice().forEach((enemy) => { const ec = centerOf(enemy); if (Math.hypot(pc.x - ec.x, pc.y - ec.y) < 170) { enemy.hp -= 2; if (enemy.hp <= 0) { addScore(scoreFor(enemy.kind)); enemies = enemies.filter((item) => item !== enemy); } } }); spawnParticles(pc.x, pc.y, "#ff795e", 38);
}

function directionClearance(enemy, direction, maxDistance = 56) {
  return measureDirectionClearance(map, enemy, direction, maxDistance);
}
function chooseEscapeDirection(enemy) {
  const order = enemy.strafeSign > 0 ? ["right", "down", "left", "up"] : ["left", "up", "right", "down"];
  const ranked = order.map((direction) => ({ direction, clearance: directionClearance(enemy, direction, 80) }))
    .sort((a, b) => b.clearance - a.clearance || (a.direction === enemy.moveDir ? 1 : -1));
  enemy.strafeSign *= -1;
  return ranked[0]?.clearance >= 8 ? ranked[0].direction : oppositeDirection(enemy.moveDir);
}
function findRouteDirection(enemy, target) {
  const ec = centerOf(enemy);
  const start = { col: Math.floor(ec.x / TILE), row: Math.floor(ec.y / TILE) };
  const goal = { col: Math.floor(target.x / TILE), row: Math.floor(target.y / TILE) };
  const queue = [{ ...start, first: null }]; const visited = new Set([`${start.col},${start.row}`]);
  for (let cursor = 0; cursor < queue.length && cursor < COLS * ROWS; cursor += 1) {
    const node = queue[cursor];
    if (node.col === goal.col && node.row === goal.row) return node.first;
    for (const direction of ["up", "right", "down", "left"]) {
      const d = DIRS[direction]; const col = node.col + d.x; const row = node.row + d.y; const key = `${col},${row}`;
      if (visited.has(key) || !canOccupy(map, col * TILE + 6, row * TILE + 6, enemy.w)) continue;
      visited.add(key); queue.push({ col, row, first: node.first ?? direction });
    }
  }
  return null;
}
function chooseAiDirection(enemy) {
  const target = predictedPlayerPoint(enemy.isBoss ? 0.5 : 0.28);
  const ec = centerOf(enemy); const horizontal = Math.abs(target.x - ec.x) > Math.abs(target.y - ec.y);
  const primary = horizontal ? (target.x < ec.x ? "left" : "right") : (target.y < ec.y ? "up" : "down");
  const habitual = mostUsedDirection(combatMemory.moves);
  const counterAim = oppositeDirection(mostUsedDirection(combatMemory.shots));
  const secondary = horizontal ? (target.y < ec.y ? "up" : "down") : (target.x < ec.x ? "left" : "right");
  const flank = perpendicularDirections(habitual)[enemy.strafeSign > 0 ? 0 : 1];
  const route = findRouteDirection(enemy, target);
  const distance = Math.hypot(target.x - ec.x, target.y - ec.y);
  let tactical = [primary, secondary, counterAim, flank];
  if (enemy.strategy === "避实击虚") tactical = [counterAim, flank, secondary, primary];
  if (enemy.strategy === "声东击西") tactical = [flank, oppositeDirection(flank), secondary, primary];
  if (enemy.strategy === "以逸待劳") tactical = distance < 190 ? [oppositeDirection(primary), flank, secondary] : [flank, secondary, primary];
  if (enemy.strategy === "围师必阙") tactical = [flank, secondary, oppositeDirection(primary), primary];
  if (enemy.strategy === "因敌制胜") tactical = distance < 150 ? [oppositeDirection(primary), counterAim, flank] : [counterAim, flank, primary, secondary];
  const options = [route, ...tactical, habitual, "up", "right", "down", "left"].filter(Boolean);
  for (const direction of [...new Set(options)]) if (directionClearance(enemy, direction, 32) >= 16) return direction;
  return chooseEscapeDirection(enemy);
}
function incomingBulletDodge(enemy) {
  if (enemy.dodgeCooldown > 0 || !bullets?.length || enemy.aiTier < 1.8) return null;
  const ec = centerOf(enemy);
  let threat = null; let closest = Infinity;
  for (const bullet of bullets) {
    if (bullet.owner !== "player") continue;
    const bx = bullet.x + bullet.w / 2; const by = bullet.y + bullet.h / 2;
    const toX = ec.x - bx; const toY = ec.y - by; const distance = Math.hypot(toX, toY) || 1;
    const approach = bullet.dx * toX + bullet.dy * toY;
    const lateral = Math.abs(bullet.dx * toY - bullet.dy * toX);
    if (approach > 0 && lateral < 30 + enemy.aiTier * 2 && distance < 180 && distance < closest) { threat = bullet; closest = distance; }
  }
  if (!threat) return null;
  const side = enemy.strafeSign;
  const dodgeOptions = side > 0 ? ["down", "right", "up", "left"] : ["up", "left", "down", "right"];
  for (const direction of dodgeOptions) { if (directionClearance(enemy, direction, 32) >= 16) { enemy.dodgeCooldown = Math.max(0.12, 0.44 / enemy.aiTier); enemy.strafeSign *= -1; return direction; } }
  return null;
}
function updateEnemy(enemy, dt) {
  enemy.updateCooldown(dt); enemy.updatePowerUps(dt);
  enemy.dodgeCooldown = Math.max(0, enemy.dodgeCooldown - dt);
  enemy.tacticalTimer = Math.max(0, enemy.tacticalTimer - dt);
  enemy.escapeTimer = Math.max(0, enemy.escapeTimer - dt);
  if (enemy.freezeTimer > 0) return;
  if (enemy.tacticalTimer <= 0) { enemy.strategy = selectSunTzuStrategy(enemy); enemy.tacticalTimer = enemy.isBoss ? 0.8 : 2.2; if (enemy.isBoss || enemy === enemies[0]) activeStrategy = enemy.strategy; }
  const pc = predictedPlayerPoint(enemy.isBoss ? 0.5 : 0.32); const ec = centerOf(enemy); enemy.aimVector(pc.x - ec.x, pc.y - ec.y);
  const dodgeDirection = incomingBulletDodge(enemy);
  if (dodgeDirection) enemy.moveDir = dodgeDirection;
  if (enemy.aiTimer <= 0 && enemy.escapeTimer <= 0) { enemy.aiTimer = Math.max(0.16, 0.72 - enemy.aiTier * 0.025); enemy.state = enemy.isBoss ? "counter" : Math.random() < 0.72 ? "chase" : "patrol"; enemy.moveDir = dodgeDirection ?? chooseAiDirection(enemy); }
  const beforeX = enemy.x; const beforeY = enemy.y; const d = DIRS[enemy.moveDir]; const blocked = enemy.moveVector(d.x, d.y, dt, map);
  const moved = Math.hypot(enemy.x - beforeX, enemy.y - beforeY);
  enemy.stuckTimer = moved < 0.08 ? enemy.stuckTimer + dt : 0;
  if (blocked.blockedX || blocked.blockedY || enemy.stuckTimer > 0.32) {
    enemy.moveDir = chooseEscapeDirection(enemy); enemy.aiTimer = 0.48; enemy.escapeTimer = 0.48; enemy.stuckTimer = 0;
  }
  enemy.lastMoveX = enemy.x; enemy.lastMoveY = enemy.y;
  const aligned = Math.abs(pc.x - ec.x) < 22 || Math.abs(pc.y - ec.y) < 22;
  const tacticalShot = enemy.isBoss || enemy.aiTier >= 3 ? 0.98 : 0.72;
  if ((aligned || enemy.isBoss) && Math.random() < dt * tacticalShot) fireTank(enemy);
}

function tileAtPoint(x, y) { return map[Math.floor(y / TILE)]?.[Math.floor(x / TILE)] ?? 2; }
function bounceBullet(bullet, oldX, oldY) {
  const oldCx = oldX + bullet.w / 2; const oldCy = oldY + bullet.h / 2;
  const newCx = bullet.x + bullet.w / 2; const newCy = bullet.y + bullet.h / 2;
  const blockedX = isSolid(tileAtPoint(newCx, oldCy)); const blockedY = isSolid(tileAtPoint(oldCx, newCy));
  bullet.x = oldX; bullet.y = oldY;
  if (blockedX || !blockedY) bullet.dx *= -1;
  if (blockedY || !blockedX) bullet.dy *= -1;
  bullet.bounceCount += 1;
  return bullet.bounceCount > bullet.maxBounces;
}
function explodeTank(tank) {
  const c = centerOf(tank);
  spawnParticles(c.x, c.y, "#ffcf6b", 34);
  spawnParticles(c.x, c.y, tank.color, 24);
  spawnParticles(c.x, c.y, "#1b2529", 16);
}
function damagePlayer() {
  if (player.invincibleTimer > 0 || player.explosionTimer > 0) return;
  levelDeaths += 1;
  const respawnX = player.x; const respawnY = player.y;
  player.explosionTimer = 0.45; explodeTank(player);
  if (lives > 1) {
    lives -= 1; player.x = respawnX; player.y = respawnY; player.invincibleTimer = 3; bullets = bullets.filter((bullet) => bullet.owner !== "enemy");
  } else { lives = 0; endGame(false, "能源站失守"); }
}
function applyBulletHit(target, bullet) {
  if (target.type === "player") { if (target.shieldCharges > 0) { target.shieldCharges -= 1; spawnParticles(target.x + 14, target.y + 14, "#58d1c9", 8); } else damagePlayer(); return; }
  if (target.shieldCharges > 0) { target.shieldCharges -= 1; spawnParticles(target.x + target.w / 2, target.y + target.h / 2, "#58d1c9", 8); return; }
  target.hp -= bullet.kind === "laser" ? 2 : 1;
  if (bullet.kind === "freeze") target.freezeTimer = 7;
  spawnParticles(target.x + target.w / 2, target.y + target.h / 2, target.color, 10);
  if (target.hp <= 0) { addScore(scoreFor(target.kind)); if (!levelSkillDropped || Math.random() < 0.35) spawnPowerUp(target.x + 14, target.y + 14); enemies = enemies.filter((item) => item !== target); explodeTank(target); }
}
function updateBullets(dt) {
  for (let i = bullets.length - 1; i >= 0; i -= 1) {
    const bullet = bullets[i]; const oldX = bullet.x; const oldY = bullet.y; bullet.update(dt); let remove = bullet.life <= 0;
    const tile = tileAtPoint(bullet.x + bullet.w / 2, bullet.y + bullet.h / 2);
    if (tile === 1) { if (destroyBrick(map, bullet)) addScore(SCORE.wall); spawnParticles(bullet.x, bullet.y, "#e78a43", 5); remove = true; }
    else if (tile === 4) { bullet.speedScale = 0.42; }
    else { bullet.speedScale = 1; if (isSolid(tile)) { remove = bounceBullet(bullet, oldX, oldY); spawnParticles(bullet.x, bullet.y, "#f8e6a3", 3); } }
    if (!remove) {
      const targets = bullet.owner === "player" ? [...enemies, player] : [player, ...enemies];
      const target = targets.find((candidate) => rectsOverlap(bullet, candidate) && (candidate !== bullet.source || bullet.bounceCount > 0 || bullet.age > 0.12));
      if (target) { remove = true; applyBulletHit(target, bullet); }
    }
    if (remove) bullets.splice(i, 1);
  }
}
function updatePowerUps(dt) { powerUps.forEach((powerUp) => powerUp.update(dt)); for (let i = powerUps.length - 1; i >= 0; i -= 1) { const powerUp = powerUps[i]; if (powerUp.life <= 0) powerUps.splice(i, 1); else { const collector = [player, ...enemies].find((tank) => rectsOverlap(powerUp, tank)); if (collector) { applyPowerUp(collector, powerUp); powerUps.splice(i, 1); } } } }
function updateParticles(dt) { particles.forEach((particle) => particle.update(dt)); particles = particles.filter((particle) => particle.life > 0); }
function update(dt) { if (state !== "playing") return; timeLeft -= dt; updatePlayer(dt); enemies.forEach((enemy) => updateEnemy(enemy, dt)); updateBullets(dt); updatePowerUps(dt); updateParticles(dt); if (enemies.length === 0) finishLevel(); else if (timeLeft <= 0) endGame(false, "沙暴吞没了战场"); updateHud(); }

function drawBackground() {
  ctx.fillStyle = "#172126";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  if (brandingImage.complete && brandingImage.naturalWidth) {
    ctx.save();
    ctx.globalAlpha = 0.52;
    ctx.filter = "blur(1.5px) saturate(1.15) contrast(1.08)";
    ctx.drawImage(brandingImage, 0, 0, canvas.width, canvas.height);
    ctx.restore();
  }
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, "#16242a66");
  grad.addColorStop(1, "#101d2399");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "900 86px system-ui, sans-serif";
  ctx.lineWidth = 8;
  ctx.strokeStyle = "#071116b8";
  ctx.strokeText("FRC", canvas.width / 2, canvas.height - 78);
  ctx.fillStyle = "#9df5e1a8";
  ctx.fillText("FRC", canvas.width / 2, canvas.height - 78);
  ctx.font = "700 15px system-ui, sans-serif";
  ctx.letterSpacing = "3px";
  ctx.fillStyle = "#eafff0c9";
  ctx.fillText("ORIGINAL TANK BATTLE · WAVEPEAK ELITE", canvas.width / 2, canvas.height - 26);
  ctx.restore();
  ctx.fillStyle = "#f5cb7a22";
  for (let i = 0; i < 32; i += 1) ctx.fillRect((i * 97) % canvas.width, (i * 47) % canvas.height, 2, 2);
}
function drawMap() { for (let row = 0; row < ROWS; row += 1) for (let col = 0; col < COLS; col += 1) { const tile = map[row][col]; const x = col * TILE; const y = row * TILE; if (tile === 0) continue; const inset = tile === 2 ? 7 : 4; ctx.fillStyle = tile === 1 ? "#9a4e36" : tile === 2 ? "#384d55" : tile === 3 ? "#ad8b4c" : tile === 4 ? "#387e88" : "#e78a43"; ctx.fillRect(x + inset, y + inset, TILE - inset * 2, TILE - inset * 2); ctx.strokeStyle = tile === 1 ? "#db8150" : tile === 2 ? "#789099" : "#ffffff18"; ctx.lineWidth = tile === 2 ? 1 : 2; ctx.strokeRect(x + inset, y + inset, TILE - inset * 2, TILE - inset * 2); if (tile === 9) { ctx.fillStyle = "#f9d889"; ctx.fillRect(x + 10, y + 8, 20, 24); ctx.fillStyle = "#8b4b36"; ctx.fillRect(x + 14, y + 14, 12, 18); } } }
function draw() { drawBackground(); drawMap(); powerUps?.forEach((powerUp) => powerUp.draw(ctx)); enemies?.forEach((enemy) => enemy.draw(ctx)); player?.draw(ctx); bullets?.forEach((bullet) => bullet.draw(ctx)); particles?.forEach((particle) => particle.draw(ctx)); }
function finishLevel() { if (state !== "playing") return; pauseBackgroundMusic(); saveCombatMemory(true); playVictorySound(); addScore(Math.ceil(Math.max(0, timeLeft)) * 2); if (levelDeaths === 0) addScore(SCORE.flawless); if (levelIndex < LEVELS.length - 1) { lives += 1; state = "levelComplete"; showScreen(`第 ${levelIndex + 1} 关完成`, `获得 1 条附加生命 · 当前分数 ${formatScore(score)}`, "进入下一关"); } else { lives = 1; state = "won"; showScreen("全部关卡完成", `最终得分 ${formatScore(score)} · 附加生命已清除`, "再玩一次"); } updateHud(); }
function endGame(won, message) { if (state !== "playing") return; pauseBackgroundMusic(); saveCombatMemory(true); if (!won) playDefeatSound(); state = won ? "won" : "lost"; showScreen(message, won ? `最终得分 ${formatScore(score)}` : `最终得分 ${formatScore(score)} · 按 R 或按钮重新开始`); updateHud(); }
function loop(timestamp) { const dt = Math.min(0.04, (timestamp - lastTime) / 1000 || 0); lastTime = timestamp; update(dt); draw(); requestAnimationFrame(loop); }

startButton.addEventListener("click", () => { if (state === "levelComplete") { startLevel(levelIndex + 1); startGameMusicFromBeginning(); } else { resetGame(); startGameMusicFromBeginning(); } }); pauseButton.addEventListener("click", () => { if (state === "playing") { state = "paused"; pauseBackgroundMusic(); pauseButton.textContent = "继续"; showScreen("战术暂停", "确认路线后继续作战。", "继续作战"); } else if (state === "paused") { state = "playing"; pauseButton.textContent = "暂停"; screen.classList.add("hidden"); playBackgroundMusic(); } });
soundButton.addEventListener("click", () => { soundOn = !soundOn; soundButton.textContent = `音效：${soundOn ? "开" : "关"}`; soundButton.setAttribute("aria-pressed", String(soundOn)); if (soundOn) { if (state === "menu") playMenuMusic(); else playBackgroundMusic(); } else { pauseMenuMusic(); pauseBackgroundMusic(); victorySound.pause(); defeatSound.pause(); } });
function updatePointer(event) { const rect = canvas.getBoundingClientRect(); pointer = { x: (event.clientX - rect.left) * (canvas.width / rect.width), y: (event.clientY - rect.top) * (canvas.height / rect.height) }; }
canvas.addEventListener("mousemove", updatePointer);
canvas.addEventListener("mousedown", (event) => { updatePointer(event); if (event.button === 0) { mouseFire = true; event.preventDefault(); } });
canvas.addEventListener("contextmenu", (event) => event.preventDefault());
window.addEventListener("mouseup", (event) => { if (event.button === 0) mouseFire = false; });
window.addEventListener("keydown", (event) => { const key = event.key.length === 1 ? event.key.toLowerCase() : event.key; if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(event.key)) event.preventDefault(); keys.add(key); if (key === "p") pauseButton.click(); if (key === "r") { resetGame(); startGameMusicFromBeginning(); } if (key === "e") useBomb(); });
window.addEventListener("keyup", (event) => keys.delete(event.key.length === 1 ? event.key.toLowerCase() : event.key));
resetGame(); state = "menu"; showScreen("守住能源核心", "摧毁所有入侵坦克，保护右下角的能源核心。", "开始作战");
window.addEventListener("pointerdown", playMenuMusic, { once: true });
window.addEventListener("keydown", playMenuMusic, { once: true });
playMenuMusic(); requestAnimationFrame(loop);

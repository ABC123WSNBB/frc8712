export const TILE = 40;
export const COLS = 24;
export const ROWS = 16;

export const DIRS = Object.freeze({
  up: { x: 0, y: -1, angle: -Math.PI / 2 },
  down: { x: 0, y: 1, angle: Math.PI / 2 },
  left: { x: -1, y: 0, angle: Math.PI },
  right: { x: 1, y: 0, angle: 0 },
});

export const SCORE = Object.freeze({ wall: 10, scout: 100, guard: 200, hunter: 300, bonus: 50, flawless: 500 });

// 0 空地，1 砖墙，2 钢墙，3 沙丘（减速），4 水域，9 能源核心。
const LEVEL_ONE = [
  "222222222222222222222222",
  "2......................2",
  "2..1111......1111......2",
  "2..1..1..33..1..1......2",
  "2..1..1..33..1..1..22..2",
  "2..1111......1111..22..2",
  "2......................2",
  "2....22....44....22....2",
  "2....22....44....22....2",
  "2......................2",
  "2..1111..22..1111......2",
  "2..1..1..22..1..1..22..2",
  "2..1..1......1..1..22..2",
  "2..1111......1111......2",
  "2....................9.2",
  "222222222222222222222222",
];

const LEVEL_TWO = [
  "222222222222222222222222",
  "2......................2",
  "2..111...22...111...22.2",
  "2..1.1...22...1.1...22.2",
  "2..111..33...111..33...2",
  "2......44....44........2",
  "2..22..............22..2",
  "2..22..1111..1111..22..2",
  "2......1..1..1..1......2",
  "2..33..1..1..1..1..33..2",
  "2..33..1111..1111..33..2",
  "2......................2",
  "2..111...22...111...22.2",
  "2..1.................1.2",
  "2.................9....2",
  "222222222222222222222222",
];

const LEVEL_THREE = [
  "222222222222222222222222",
  "2..22......22......22..2",
  "2..22..11..22..11..22..2",
  "2......11......11......2",
  "2..44..1111..1111..44..2",
  "2..44..............44..2",
  "2....22..33..33..22....2",
  "2....22..33..33..22....2",
  "2..1111............111.2",
  "2..1..1..22222222..1...2",
  "2..1..1..2......2..1...2",
  "2..1111..2..11..2..111.2",
  "2........2..11..2......2",
  "2..22....2......2...22.2",
  "2....................9.2",
  "222222222222222222222222",
];

// 十关战役：地图结构逐步重复利用并由敌人规模/强度推进难度，保持 MVP 轻量。
export const LEVELS = Object.freeze([
  LEVEL_ONE, LEVEL_TWO, LEVEL_THREE,
  LEVEL_TWO, LEVEL_THREE, LEVEL_ONE,
  LEVEL_TWO, LEVEL_THREE, LEVEL_ONE, LEVEL_THREE,
]);
export const LEVEL = LEVEL_ONE;

export function isSolid(tile) { return tile === 1 || tile === 2 || tile === 4 || tile === 9; }
export function rectsOverlap(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }
export function centerOf(entity) { return { x: entity.x + entity.w / 2, y: entity.y + entity.h / 2 }; }
export function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
export function formatScore(value) { return String(Math.max(0, Math.floor(value))).padStart(6, "0"); }
export function scoreFor(type) { return SCORE[type] ?? 0; }

export function tileAt(level, col, row) {
  if (row < 0 || row >= level.length || col < 0 || col >= level[row].length) return 2;
  return Number(level[row][col]) || 0;
}

export function mapToTiles(level) {
  return level.map((row) => row.padEnd(COLS, "2").slice(0, COLS).split("").map((char) => {
    if (char === ".") return 0;
    if (char === "9") return 9;
    return Number(char);
  }));
}

export function canOccupy(map, x, y, size) {
  const left = Math.floor(x / TILE);
  const right = Math.floor((x + size - 0.01) / TILE);
  const top = Math.floor(y / TILE);
  const bottom = Math.floor((y + size - 0.01) / TILE);
  for (let row = top; row <= bottom; row += 1) {
    for (let col = left; col <= right; col += 1) if (isSolid(map[row]?.[col] ?? 2)) return false;
  }
  return true;
}

export function measureDirectionClearance(map, entity, direction, maxDistance = 56) {
  const d = DIRS[direction];
  if (!d) return 0;
  let clearance = 0;
  for (let distance = 8; distance <= maxDistance; distance += 8) {
    if (!canOccupy(map, entity.x + d.x * distance, entity.y + d.y * distance, entity.w)) break;
    clearance = distance;
  }
  return clearance;
}

export function moveWithCollision(entity, dx, dy, map) {
  const oldX = entity.x; const oldY = entity.y;
  entity.x += dx;
  if (!canOccupy(map, entity.x, entity.y, entity.w)) entity.x = oldX;
  entity.y += dy;
  if (!canOccupy(map, entity.x, entity.y, entity.h)) entity.y = oldY;
  return { blockedX: entity.x === oldX && dx !== 0, blockedY: entity.y === oldY && dy !== 0 };
}

export function destroyBrick(map, bullet) {
  const left = Math.floor(bullet.x / TILE); const right = Math.floor((bullet.x + bullet.w) / TILE);
  const top = Math.floor(bullet.y / TILE); const bottom = Math.floor((bullet.y + bullet.h) / TILE);
  for (let row = top; row <= bottom; row += 1) for (let col = left; col <= right; col += 1) {
    if (map[row]?.[col] === 1) { map[row][col] = 0; return true; }
  }
  return false;
}

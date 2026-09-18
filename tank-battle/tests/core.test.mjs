import test from "node:test";
import assert from "node:assert/strict";
import { LEVELS, SCORE, canOccupy, destroyBrick, formatScore, mapToTiles, measureDirectionClearance, rectsOverlap, scoreFor } from "../src/core.js";

test("campaign contains ten levels", () => {
  assert.equal(LEVELS.length, 10);
});

test("score rules are deterministic", () => {
  assert.equal(scoreFor("scout"), 100);
  assert.equal(scoreFor("guard"), 200);
  assert.equal(scoreFor("hunter"), 300);
  assert.equal(SCORE.wall, 10);
  assert.equal(formatScore(42), "000042");
});

test("map collision blocks solid tiles and allows open tiles", () => {
  const map = mapToTiles(["222", "2.2", "211"]);
  assert.equal(canOccupy(map, 40, 40, 20), true);
  assert.equal(canOccupy(map, 0, 0, 20), false);
});

test("brick destruction changes only a brick tile", () => {
  const map = mapToTiles(["111", "222", "..."]);
  assert.equal(destroyBrick(map, { x: 0, y: 0, w: 8, h: 8 }), true);
  assert.equal(map[0][0], 0);
  assert.equal(destroyBrick(map, { x: 40, y: 40, w: 8, h: 8 }), false);
});

test("rectangle overlap detects bullet hits", () => {
  assert.equal(rectsOverlap({ x: 10, y: 10, w: 8, h: 8 }, { x: 15, y: 15, w: 20, h: 20 }), true);
  assert.equal(rectsOverlap({ x: 10, y: 10, w: 8, h: 8 }, { x: 30, y: 30, w: 20, h: 20 }), false);
});

test("AI can measure a clear escape route away from cover", () => {
  const map = Array.from({ length: 5 }, () => Array(5).fill(0));
  map[1][2] = 2;
  const enemy = { x: 40, y: 40, w: 28 };
  assert.ok(measureDirectionClearance(map, enemy, "left", 40) > measureDirectionClearance(map, enemy, "right", 40));
});

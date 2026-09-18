import test from "node:test";
import assert from "node:assert/strict";
import { Bullet, PowerUp, Tank } from "../src/entities.js";

test("shield is a one-hit charge, not a timed invulnerability", () => {
  const tank = new Tank({ x: 0, y: 0, type: "player" });
  tank.shieldCharges = 1;
  tank.updatePowerUps(20);
  assert.equal(tank.shieldCharges, 1);
  tank.shieldCharges -= 1;
  assert.equal(tank.shieldCharges, 0);
});

test("speed and rapid-fire effects remain timed", () => {
  const tank = new Tank({ x: 0, y: 0, type: "enemy" });
  tank.speedTimer = 3;
  tank.rapidTimer = 2;
  tank.updatePowerUps(1);
  assert.equal(tank.speedTimer, 2);
  assert.equal(tank.rapidTimer, 1);
});

test("turret can aim independently from tank movement direction", () => {
  const tank = new Tank({ x: 0, y: 0, type: "player" });
  tank.aimVector(3, 4);
  assert.equal(tank.aimDx, 0.6);
  assert.equal(tank.aimDy, 0.8);
  const bullet = tank.shoot();
  assert.equal(bullet.dx, 0.6);
  assert.equal(bullet.dy, 0.8);
});

test("new Tank Turmoil style pickups have gameplay-ready projectile sizes", () => {
  const laser = new Bullet(0, 0, 1, 0, "player", "laser");
  const bomb = new PowerUp(0, 0, "bomb");
  assert.equal(laser.w, 5);
  assert.equal(laser.speed, 500);
  assert.equal(bomb.type, "bomb");
});

test("enemy keeps a movement direction independent from turret aim", () => {
  const tank = new Tank({ x: 0, y: 0, type: "enemy" });
  tank.moveDir = "left";
  tank.aimVector(1, 0);
  assert.equal(tank.moveDir, "left");
  assert.equal(tank.aimDx, 1);
});

test("bullets carry bounce and self-hit metadata", () => {
  const tank = new Tank({ x: 0, y: 0, type: "player" });
  const bullet = tank.shoot();
  assert.equal(bullet.source, tank);
  assert.equal(bullet.bounceCount, 0);
  assert.equal(bullet.maxBounces, 3);
});

test("bullets expose a water slowdown scale", () => {
  const bullet = new Bullet(0, 0, 1, 0, "player", "scout");
  bullet.speedScale = 0.42;
  bullet.update(1);
  assert.ok(Math.abs(bullet.x - 142.8) < 0.001);
});

test("enemy speed pickups never increase AI movement speed", () => {
  const tank = new Tank({ x: 40, y: 40, type: "enemy", kind: "scout" });
  tank.speedTimer = 9;
  const openMap = Array.from({ length: 4 }, () => Array(6).fill(0));
  tank.moveVector(1, 0, 0.1, openMap);
  assert.ok(Math.abs(tank.x - (40 + tank.baseSpeed * 0.1)) < 0.001);
});

import test from "node:test";
import assert from "node:assert/strict";

import { canPlayCursorOrchestra, planRoutes, bezier, arcControls, travelTime, easeInOutCubic } from "../js/cursor-path.js";

test("desativa cursores com movimento reduzido", () => {
  assert.equal(canPlayCursorOrchestra({ reducedMotion: true, finePointer: true }), false);
});

test("ativa cursores apenas com ponteiro fino", () => {
  assert.equal(canPlayCursorOrchestra({ reducedMotion: false, finePointer: true }), true);
  assert.equal(canPlayCursorOrchestra({ reducedMotion: false, finePointer: false }), false);
});

test("desativa cursores em telas pequenas mesmo com mouse conectado", () => {
  assert.equal(canPlayCursorOrchestra({ reducedMotion: false, finePointer: true, compactViewport: true }), false);
});

test("distribui os blocos entre os cursores em rodízio", () => {
  assert.deepEqual(planRoutes(5, 3), [[0, 3], [1, 4], [2]]);
  assert.deepEqual(planRoutes(2, 3), [[0], [1]]);
});

test("a curva começa e termina nos pontos certos e é suave", () => {
  const a = { x: 0, y: 0 }, b = { x: 300, y: 100 };
  const [c1, c2] = arcControls(a, b);
  assert.deepEqual(bezier(a, c1, c2, b, 0), a);
  const fim = bezier(a, c1, c2, b, 1);
  assert.ok(Math.abs(fim.x - 300) < 1e-9 && Math.abs(fim.y - 100) < 1e-9);
  assert.equal(easeInOutCubic(0.5), 0.5);
});

test("viagens longas demoram mais, dentro de um limite", () => {
  assert.equal(travelTime({ x: 0, y: 0 }, { x: 10, y: 0 }), 0.75);
  assert.equal(travelTime({ x: 0, y: 0 }, { x: 5000, y: 0 }), 1.4);
});

import test from "node:test";
import assert from "node:assert/strict";

import { sample, autoRange, niceStep } from "../js/graph.js";

test("amostra a função afim nas pontas do intervalo", () => {
  const pts = sample((x) => 40 + 3 * x, -10, 10, 4);
  assert.equal(pts[0].y, 10);
  assert.equal(pts.at(-1).y, 70);
});

test("ponto não finito vira buraco (quebra a curva)", () => {
  const pts = sample((x) => 1 / x, -1, 1, 2);
  assert.equal(pts[1], null);
});

test("o intervalo automático cabe a curva com folga", () => {
  const r = autoRange((x) => x * x, -2, 2);
  assert.ok(r.yMin < 0 && r.yMax > 4);
});

test("passos de grade são 1, 2 ou 5 vezes potência de 10", () => {
  assert.equal(niceStep(100), 10);
  assert.equal(niceStep(40), 5);
  assert.equal(niceStep(7), 1);
});

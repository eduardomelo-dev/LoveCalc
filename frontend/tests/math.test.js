import test from "node:test";
import assert from "node:assert/strict";

import {
  calculateFunction, tabelaFuncao, lerNumero, formatNumber,
  LIMITES, calcularDerivada, DERIVADAS, calcularIntegral, INTEGRAIS, simpson,
} from "../js/math.js";

const perto = (a, b, tol = 1e-6) => assert.ok(Math.abs(a - b) < tol, `${a} ≉ ${b}`);

test("calcula os cinco tipos de função", () => {
  assert.equal(calculateFunction("constant", 12), 55);
  assert.equal(calculateFunction("linear", 10), 70);
  assert.equal(calculateFunction("quadratic", 50), 100);
  assert.equal(calculateFunction("absolute", 40), 80);
  perto(calculateFunction("exponential", 10), 69.8806, 1e-3);
});

test("monta a tabela de entradas e saídas em volta de x", () => {
  assert.deepEqual(tabelaFuncao("linear", 10).map((p) => p.y), [64, 67, 70, 73, 76]);
});

test("valida números digitados", () => {
  assert.deepEqual(lerNumero("2,5"), { ok: true, valor: 2.5 });
  assert.equal(lerNumero("−3").valor, -3);
  assert.equal(lerNumero("").ok, false);
  assert.equal(lerNumero("abc").ok, false);
  assert.equal(lerNumero("500", { max: 100 }).ok, false);
});

test("formata no padrão brasileiro com sinal de menos tipográfico", () => {
  assert.equal(formatNumber(-1234.5), "−1.234,5");
});

test("limite removível vale 2a e a tabela se aproxima dele", () => {
  const r = LIMITES.removivel.calcular(5);
  assert.equal(r.valor, 10);
  perto(r.direita.at(-1).y, 10, 1e-2);
  perto(r.esquerda.at(-1).y, 10, 1e-2);
});

test("limite |x|/x em 0 não existe: laterais −1 e 1", () => {
  const r = LIMITES.lateral.calcular();
  assert.equal(r.existe, false);
  assert.equal(r.esquerda[0].y, -1);
  assert.equal(r.direita[0].y, 1);
});

test("limite no infinito vale 3", () => {
  assert.equal(LIMITES.infinito.calcular().valor, 3);
});

test("as seis derivadas batem com a conferência numérica", () => {
  for (const regra of Object.keys(DERIVADAS)) {
    const r = calcularDerivada(regra, 1.5);
    assert.ok(r.ok, regra);
    perto(r.inclinacao, r.numerica, 1e-4);
  }
});

test("quociente recusa x = −2 (divisão por zero)", () => {
  assert.equal(calcularDerivada("quociente", -2).ok, false);
});

test("integrais: primitiva exata confere com Simpson", () => {
  for (const tipo of Object.keys(INTEGRAIS)) {
    const { a, b } = INTEGRAIS[tipo];
    const r = calcularIntegral(tipo, a, b);
    perto(r.valor, r.numerica, 1e-4);
  }
  perto(calcularIntegral("definida", 0, 7).valor, 350 + 280 / Math.PI, 1e-9);
  perto(simpson((x) => x * x, 0, 3), 9, 1e-9);
});

// Confere que a API dá os mesmos números e textos que frontend/js/math.js (só lê o arquivo).
import { test } from "node:test";
import assert from "node:assert/strict";

import { usarServidor } from "./servidor.js";
import { FUNCOES, LIMITES, calculateFunction, tabelaFuncao } from "../../frontend/js/math.js";

const api = usarServidor();
const perto = (a, b) => assert.ok(Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(b)), `${a} ≉ ${b}`);
const XS = [-1000, -37.5, -2, 0, 0.1, 1, 10, 49.99, 50, 123.456, 1000];

const mesmosPontos = (api, front) => {
  assert.equal(api.length, front.length);
  api.forEach((p, i) => {
    perto(p.x, front[i].x);
    perto(p.y, front[i].y);
  });
};

test("funções: mesmo valor, tabela e textos do front-end", async () => {
  for (const tipo of Object.keys(FUNCOES)) {
    const front = FUNCOES[tipo];
    for (const x of XS) {
      const r = await api.post("/api/funcoes/calcular", { tipo, x });
      assert.equal(r.status, 200, `${tipo} em ${x}`);
      perto(r.corpo.y, calculateFunction(tipo, x));
      mesmosPontos(r.corpo.tabela, tabelaFuncao(tipo, x));
      assert.equal(r.corpo.formula, front.formula);
      assert.equal(r.corpo.dominio, front.dominio);
      assert.equal(r.corpo.imagem, front.imagem);
      assert.equal(r.corpo.explicacao, front.explica());
    }
  }
});

test("limites: mesmo valor, aproximações, passos e fórmula do front-end", async () => {
  for (const caso of Object.keys(LIMITES)) {
    for (const a of LIMITES[caso].pedeA ? XS : [undefined]) {
      const r = await api.post("/api/limites/calcular", { caso, a });
      const front = LIMITES[caso].calcular(a);
      assert.equal(r.status, 200, `${caso} com a = ${a}`);
      assert.equal(r.corpo.existe, front.existe);
      if (front.valor === null) assert.equal(r.corpo.valor, null);
      else perto(r.corpo.valor, front.valor);
      mesmosPontos(r.corpo.esquerda, front.esquerda);
      mesmosPontos(r.corpo.direita, front.direita);
      assert.deepEqual(r.corpo.passos, front.passos);
      assert.equal(r.corpo.formula, LIMITES[caso].formula(a));
    }
  }
});

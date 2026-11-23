// Testes das rotas de Derivadas e Integrais + paridade com frontend/js/math.js.
import { describe, test } from "node:test";
import assert from "node:assert/strict";

import { usarServidor } from "./servidor.js";
import {
  DERIVADAS, calcularDerivada,
  INTEGRAIS, calcularIntegral,
} from "../../frontend/js/math.js";

const api = usarServidor();
const perto = (a, b, tol = 1e-4) => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${a} ≉ ${b}`);
const derivada = (corpo) => api.post("/api/derivadas/calcular", corpo);
const integral = (corpo) => api.post("/api/integrais/calcular", corpo);

describe("POST /api/derivadas/calcular", () => {
  test("bate com o exemplo do README (potencia em x0 = 1)", async () => {
    const r = await derivada({ regra: "potencia", x0: 1 });
    assert.equal(r.status, 200);
    assert.equal(r.corpo.y0, 1);
    assert.equal(r.corpo.inclinacao, 3);
    perto(r.corpo.numerica, 3.00000001, 1e-7);
    assert.deepEqual(r.corpo.tangente, { m: 3, b: -2 });
  });

  test("calcula as seis regras e confere com a derivada numérica", async () => {
    for (const regra of Object.keys(DERIVADAS)) {
      const r = await derivada({ regra, x0: 1.5 });
      assert.equal(r.status, 200, regra);
      perto(r.corpo.inclinacao, r.corpo.numerica, 1e-4);
      assert.equal(r.corpo.tangente.m, r.corpo.inclinacao);
    }
  });

  test("quociente em x0 = −2 retorna HTTP 422 (divisão por zero)", async () => {
    const r = await derivada({ regra: "quociente", x0: -2 });
    assert.equal(r.status, 422);
    assert.deepEqual(r.corpo, { erro: "x = −2 zera o denominador: a função não existe aí." });
  });

  test("paridade com frontend/js/math.js em vários pontos", async () => {
    const pontos = [-10, -1, 0, 1.5, 5, 20];
    for (const regra of Object.keys(DERIVADAS)) {
      for (const x0 of pontos) {
        const front = calcularDerivada(regra, x0);
        const r = await derivada({ regra, x0 });
        assert.equal(r.status, 200, `${regra} em ${x0}`);
        perto(r.corpo.y0, front.y0, 1e-9);
        perto(r.corpo.inclinacao, front.inclinacao, 1e-9);
        perto(r.corpo.numerica, front.numerica, 1e-9);
        perto(r.corpo.tangente.m * 3 + r.corpo.tangente.b, front.tangente(3), 1e-9);
      }
    }
  });
});

describe("POST /api/integrais/calcular", () => {
  test("bate com o exemplo do README (definida de 0 a 7)", async () => {
    const r = await integral({ tipo: "definida", a: 0, b: 7 });
    assert.equal(r.status, 200);
    perto(r.corpo.valor, 350 + 280 / Math.PI, 1e-9);
    perto(r.corpo.numerica, r.corpo.valor, 1e-4);
    perto(r.corpo.Fa, -140 / Math.PI, 1e-9);
    perto(r.corpo.Fb, 350 + 140 / Math.PI, 1e-9);
  });

  test("calcula as seis regras e confere primitiva com Simpson", async () => {
    for (const [tipo, info] of Object.entries(INTEGRAIS)) {
      const r = await integral({ tipo, a: info.a, b: info.b });
      assert.equal(r.status, 200, tipo);
      perto(r.corpo.valor, r.corpo.numerica, 1e-4);
    }
  });

  test("quando a = b, valor e numerica são 0", async () => {
    const r = await integral({ tipo: "potencia", a: 3, b: 3 });
    assert.equal(r.status, 200);
    assert.equal(r.corpo.valor, 0);
    assert.equal(r.corpo.numerica, 0);
    assert.equal(r.corpo.Fa, 20.25);
    assert.equal(r.corpo.Fb, 20.25);
  });

  test("paridade com frontend/js/math.js (incluindo intervalo invertido a > b)", async () => {
    const pares = [[0, 4], [-2, 3], [5, 1]];
    for (const tipo of Object.keys(INTEGRAIS)) {
      for (const [a, b] of pares) {
        const front = calcularIntegral(tipo, a, b);
        const r = await integral({ tipo, a, b });
        assert.equal(r.status, 200, `${tipo} [${a}, ${b}]`);
        perto(r.corpo.valor, front.valor, 1e-9);
        perto(r.corpo.numerica, front.numerica, 1e-9);
        perto(r.corpo.Fa, INTEGRAIS[tipo].F(a), 1e-9);
        perto(r.corpo.Fb, INTEGRAIS[tipo].F(b), 1e-9);
      }
    }
  });
});

describe("erros de validação (400) em Derivadas e Integrais", () => {
  const casos = [
    ["regra inválida", "/api/derivadas/calcular", { regra: "log", x0: 1 }, "Regra inválido: use constante, potencia, soma, produto, quociente ou cadeia."],
    ["x0 ausente", "/api/derivadas/calcular", { regra: "potencia" }, "Informe o valor de x0."],
    ["x0 não numérico", "/api/derivadas/calcular", { regra: "potencia", x0: "2" }, "O valor de x0 precisa ser um número."],
    ["x0 fora do intervalo", "/api/derivadas/calcular", { regra: "potencia", x0: 1500 }, "Use x0 entre −1.000 e 1.000."],
    ["tipo inválido", "/api/integrais/calcular", { tipo: "partes", a: 0, b: 2 }, "Tipo inválido: use constante, potencia, soma, exponencial, trigonometrica ou definida."],
    ["a ausente", "/api/integrais/calcular", { tipo: "potencia", b: 2 }, "Informe o valor de a."],
    ["b ausente", "/api/integrais/calcular", { tipo: "potencia", a: 0 }, "Informe o valor de b."],
    ["b fora do intervalo", "/api/integrais/calcular", { tipo: "potencia", a: 0, b: -2000 }, "Use b entre −1.000 e 1.000."],
  ];

  for (const [nome, rota, corpo, mensagem] of casos) {
    test(nome, async () => {
      const r = await api.post(rota, corpo);
      assert.equal(r.status, 400);
      assert.deepEqual(r.corpo, { erro: mensagem });
    });
  }
});

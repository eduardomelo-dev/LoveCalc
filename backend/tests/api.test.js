// Testes das rotas. Números de referência: frontend/tests/math.test.js e exemplos do README.
import { describe, test } from "node:test";
import assert from "node:assert/strict";

import { usarServidor } from "./servidor.js";
import { arredondar } from "../src/calculos/numeros.js";

const api = usarServidor();
const perto = (a, b, tol = 1e-6) => assert.ok(Math.abs(a - b) < tol, `${a} ≉ ${b}`);
const funcao = (tipo, x) => api.post("/api/funcoes/calcular", { tipo, x });
const limite = (corpo) => api.post("/api/limites/calcular", corpo);

describe("GET /api/saude", () => {
  test("responde { ok: true }", async () => {
    const r = await api.get("/api/saude");
    assert.equal(r.status, 200);
    assert.deepEqual(r.corpo, { ok: true });
  });
});

describe("POST /api/funcoes/calcular", () => {
  test("calcula os cinco tipos de função", async () => {
    assert.equal((await funcao("constant", 12)).corpo.y, 55);
    assert.equal((await funcao("linear", 10)).corpo.y, 70);
    assert.equal((await funcao("quadratic", 50)).corpo.y, 100);
    assert.equal((await funcao("absolute", 40)).corpo.y, 80);
    perto((await funcao("exponential", 10)).corpo.y, 69.8806, 1e-3);
  });

  test("monta a tabela de x − 2 até x + 2", async () => {
    const { tabela } = (await funcao("linear", 10)).corpo;
    assert.deepEqual(tabela.map((p) => p.x), [8, 9, 10, 11, 12]);
    assert.deepEqual(tabela.map((p) => p.y), [64, 67, 70, 73, 76]);
  });

  test("bate com o exemplo do README (quadrática em x = 10)", async () => {
    const r = await funcao("quadratic", 10);
    assert.equal(r.status, 200);
    assert.match(r.headers.get("content-type"), /application\/json/);
    assert.deepEqual(r.corpo, {
      formula: "Q(x) = −0,04(x − 50)² + 100",
      y: 36,
      tabela: [{ x: 8, y: 29.44 }, { x: 9, y: 32.76 }, { x: 10, y: 36 }, { x: 11, y: 39.16 }, { x: 12, y: 42.24 }],
      dominio: "ℝ (todos os reais)",
      imagem: "(−∞, 100]",
      explicacao: "Parábola com concavidade para baixo: o máximo é 100, no vértice x = 50.",
    });
  });

  test("devolve domínio, imagem e explicação de cada tipo", async () => {
    const r = (await funcao("exponential", 0)).corpo;
    assert.equal(r.y, 0);
    assert.equal(r.dominio, "ℝ (todos os reais)");
    assert.equal(r.imagem, "(−∞, 100)");
    assert.equal(r.explicacao, "Cresce rápido no começo e se aproxima de 100 sem nunca chegar (assíntota y = 100).");
    assert.equal((await funcao("constant", 0)).corpo.imagem, "{55}");
  });

  test("aceita decimais e os extremos −1000 e 1000", async () => {
    const r = await funcao("linear", 2.5);
    assert.equal(r.corpo.y, 47.5);
    assert.deepEqual(r.corpo.tabela.map((p) => p.x), [0.5, 1.5, 2.5, 3.5, 4.5]);
    assert.equal((await funcao("linear", -1000)).status, 200);
    assert.equal((await funcao("linear", 1000)).status, 200);
  });
});

describe("POST /api/limites/calcular", () => {
  test("removível com a = 5 vale 10 (exemplo do README)", async () => {
    const r = await limite({ caso: "removivel", a: 5 });
    assert.equal(r.status, 200);
    assert.deepEqual(r.corpo, {
      formula: "lim x→5 (x² − 25) / (x − 5)",
      existe: true,
      valor: 10,
      esquerda: [{ x: 4.9, y: 9.9 }, { x: 4.99, y: 9.99 }, { x: 4.999, y: 9.999 }],
      direita: [{ x: 5.1, y: 10.1 }, { x: 5.01, y: 10.01 }, { x: 5.001, y: 10.001 }],
      passos: [
        "Em x = 5 a fração vira 0/0: indeterminada.",
        "Fatore: x² − 25 = (x − 5)(x + 5).",
        "Simplifique (x − 5) e substitua: 5 + 5 = 10.",
      ],
    });
  });

  test("|x|/x em 0 não existe: laterais −1 e 1", async () => {
    const r = (await limite({ caso: "lateral" })).corpo;
    assert.equal(r.existe, false);
    assert.equal(r.valor, null);
    assert.deepEqual(r.esquerda, [{ x: -0.1, y: -1 }, { x: -0.01, y: -1 }, { x: -0.001, y: -1 }]);
    assert.deepEqual(r.direita, [{ x: 0.1, y: 1 }, { x: 0.01, y: 1 }, { x: 0.001, y: 1 }]);
    assert.equal(r.passos.at(-1), "Os limites laterais são diferentes (−1 ≠ 1): o limite não existe.");
  });

  test("no infinito vale 3; esquerda em x = 10, 100, 1000 e direita vazia", async () => {
    const r = (await limite({ caso: "infinito" })).corpo;
    assert.equal(r.existe, true);
    assert.equal(r.valor, 3);
    assert.deepEqual(r.esquerda.map((p) => p.x), [10, 100, 1000]);
    perto(r.esquerda.at(-1).y, 3, 1e-4);
    assert.deepEqual(r.direita, []);
    assert.equal(r.passos[0], "Divida numerador e denominador por x², a maior potência.");
  });

  test("lateral e infinito ignoram o a", async () => {
    assert.equal((await limite({ caso: "lateral", a: 5000 })).status, 200);
    assert.equal((await limite({ caso: "infinito", a: "abc" })).status, 200);
  });
});

describe("erros de validação (400)", () => {
  const casos = [
    ["tipo inválido", "/api/funcoes/calcular", { tipo: "seno", x: 1 }, "Tipo inválido: use constant, linear, quadratic, absolute ou exponential."],
    ["tipo ausente", "/api/funcoes/calcular", { x: 1 }, "Tipo inválido: use constant, linear, quadratic, absolute ou exponential."],
    ["tipo que é chave do Object", "/api/funcoes/calcular", { tipo: "toString", x: 1 }, "Tipo inválido: use constant, linear, quadratic, absolute ou exponential."],
    ["x ausente", "/api/funcoes/calcular", { tipo: "linear" }, "Informe o valor de x."],
    ["x como texto", "/api/funcoes/calcular", { tipo: "linear", x: "10" }, "O valor de x precisa ser um número."],
    ["x acima de 1000", "/api/funcoes/calcular", { tipo: "linear", x: 1000.5 }, "Use x entre −1.000 e 1.000."],
    ["x abaixo de −1000", "/api/funcoes/calcular", { tipo: "linear", x: -1001 }, "Use x entre −1.000 e 1.000."],
    ["caso inválido", "/api/limites/calcular", { caso: "derivada" }, "Caso inválido: use removivel, lateral ou infinito."],
    ["a ausente no removível", "/api/limites/calcular", { caso: "removivel" }, "Informe o valor de a."],
    ["a não numérico", "/api/limites/calcular", { caso: "removivel", a: true }, "O valor de a precisa ser um número."],
    ["a fora do intervalo", "/api/limites/calcular", { caso: "removivel", a: 2000 }, "Use a entre −1.000 e 1.000."],
    ["corpo que é uma lista", "/api/limites/calcular", [], "Caso inválido: use removivel, lateral ou infinito."],
  ];

  for (const [nome, rota, corpo, mensagem] of casos) {
    test(nome, async () => {
      const r = await api.post(rota, corpo);
      assert.equal(r.status, 400);
      assert.deepEqual(r.corpo, { erro: mensagem });
    });
  }

  test("JSON inválido", async () => {
    const r = await api.post("/api/funcoes/calcular", '{"tipo": "linear", x: }');
    assert.equal(r.status, 400);
    assert.deepEqual(r.corpo, { erro: "O corpo da requisição não é um JSON válido." });
  });

  test("rota que não existe dá 404 em JSON", async () => {
    const r = await api.get("/api/nada");
    assert.equal(r.status, 404);
    assert.deepEqual(r.corpo, { erro: "Rota não encontrada." });
  });
});

describe("CORS", () => {
  test("libera http://localhost:4173 nas respostas", async () => {
    const r = await api.get("/api/saude");
    assert.equal(r.headers.get("access-control-allow-origin"), "http://localhost:4173");
    const e = await funcao("seno", 1);
    assert.equal(e.headers.get("access-control-allow-origin"), "http://localhost:4173");
  });

  test("responde à pré-checagem (OPTIONS) do navegador", async () => {
    const r = await fetch(`${api.url}/api/funcoes/calcular`, {
      method: "OPTIONS",
      headers: { Origin: "http://localhost:4173", "Access-Control-Request-Method": "POST", "Access-Control-Request-Headers": "content-type" },
    });
    assert.equal(r.status, 204);
    assert.equal(r.headers.get("access-control-allow-origin"), "http://localhost:4173");
    assert.match(r.headers.get("access-control-allow-methods"), /POST/);
    assert.match(r.headers.get("access-control-allow-headers"), /Content-Type/i);
  });
});

describe("arredondamento", () => {
  test("corta em 10 casas e troca infinito por null", () => {
    assert.equal(arredondar(9.899999999999999), 9.9);
    assert.equal(arredondar(0.1 + 0.2), 0.3);
    assert.equal(arredondar(-0), 0);
    assert.equal(arredondar(Infinity), null);
    assert.equal(arredondar(-Infinity), null);
    assert.equal(arredondar(NaN), null);
  });
});

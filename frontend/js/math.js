// Contas da calculadora. Tudo aqui é puro (sem DOM), para testar e para o back-end
// poder trocar por chamadas à API sem mexer nas telas.

export function formatNumber(value, casas = 2) {
  if (value === Infinity) return "+∞";
  if (value === -Infinity) return "−∞";
  return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: casas }).format(value).replace("-", "−");
}

/** Lê um número digitado ("2,5", "-3", " 10 ") e confere o intervalo permitido. */
export function lerNumero(texto, { min = -1000, max = 1000, nome = "o valor" } = {}) {
  const limpo = String(texto ?? "").trim().replace(/\s/g, "").replace("−", "-").replace(",", ".");
  if (limpo === "") return { ok: false, erro: `Digite ${nome}.` };
  if (!/^[-+]?(\d+\.?\d*|\.\d+)$/.test(limpo)) return { ok: false, erro: `${cap(nome)} precisa ser um número.` };
  const valor = Number(limpo);
  if (valor < min || valor > max) return { ok: false, erro: `Use ${nome} entre ${formatNumber(min)} e ${formatNumber(max)}.` };
  return { ok: true, valor };
}
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

// ───────── Funções (5 tipos)
export const FUNCOES = {
  constant: {
    nome: "Constante", letra: "C", formula: "C(x) = 55", f: () => 55,
    dominio: "ℝ (todos os reais)", imagem: "{55}", intervalo: { xMin: -10, xMax: 10, yMin: 0, yMax: 100 },
    explica: () => "A saída é sempre 55, seja qual for o x.",
  },
  linear: {
    nome: "Afim", letra: "A", formula: "A(x) = 40 + 3x", f: (x) => 40 + 3 * x,
    dominio: "ℝ (todos os reais)", imagem: "ℝ (todos os reais)", intervalo: { xMin: -10, xMax: 10, yMin: 0, yMax: 100 },
    explica: () => "Cada unidade a mais em x soma 3 na saída (coeficiente angular 3).",
  },
  quadratic: {
    nome: "Quadrática", letra: "Q", formula: "Q(x) = −0,04(x − 50)² + 100", f: (x) => -0.04 * (x - 50) ** 2 + 100,
    dominio: "ℝ (todos os reais)", imagem: "(−∞, 100]", intervalo: { xMin: 0, xMax: 100, yMin: 0, yMax: 105 },
    explica: () => "Parábola com concavidade para baixo: o máximo é 100, no vértice x = 50.",
  },
  absolute: {
    nome: "Modular", letra: "M", formula: "M(x) = 100 − 2|x − 50|", f: (x) => 100 - 2 * Math.abs(x - 50),
    dominio: "ℝ (todos os reais)", imagem: "(−∞, 100]", intervalo: { xMin: 0, xMax: 100, yMin: 0, yMax: 105 },
    explica: () => "A saída cai 2 a cada unidade de distância entre x e 50.",
  },
  exponential: {
    nome: "Exponencial", letra: "E", formula: "E(x) = 100(1 − e^(−0,12x))", f: (x) => 100 * (1 - Math.exp(-0.12 * x)),
    dominio: "ℝ (todos os reais)", imagem: "(−∞, 100)", intervalo: { xMin: 0, xMax: 40, yMin: 0, yMax: 105 },
    explica: () => "Cresce rápido no começo e se aproxima de 100 sem nunca chegar (assíntota y = 100).",
  },
};

export function calculateFunction(kind, x) {
  return FUNCOES[kind].f(x);
}

/** Tabela de entradas e saídas em volta de x (5 linhas). */
export function tabelaFuncao(kind, x, passo = 1) {
  return [-2, -1, 0, 1, 2].map((k) => {
    const xi = x + k * passo;
    return { x: xi, y: calculateFunction(kind, xi) };
  });
}

// ───────── Limites (3 casos)
const APROX = [0.1, 0.01, 0.001];
export const LIMITES = {
  removivel: {
    nome: "Removível",
    formula: (a) => `lim x→${formatNumber(a)} (x² − ${formatNumber(a * a)}) / (x − ${formatNumber(a)})`,
    pedeA: true,
    calcular(a) {
      const f = (x) => (x * x - a * a) / (x - a);
      return {
        existe: true, valor: 2 * a,
        esquerda: APROX.map((h) => ({ x: a - h, y: f(a - h) })),
        direita: APROX.map((h) => ({ x: a + h, y: f(a + h) })),
        passos: [
          `Em x = ${formatNumber(a)} a fração vira 0/0: indeterminada.`,
          `Fatore: x² − ${formatNumber(a * a)} = (x − ${formatNumber(a)})(x + ${formatNumber(a)}).`,
          `Simplifique (x − ${formatNumber(a)}) e substitua: ${formatNumber(a)} + ${formatNumber(a)} = ${formatNumber(2 * a)}.`,
        ],
      };
    },
  },
  lateral: {
    nome: "Não existe",
    formula: () => "lim x→0 |x| / x",
    pedeA: false,
    calcular() {
      const f = (x) => Math.abs(x) / x;
      return {
        existe: false, valor: null,
        esquerda: APROX.map((h) => ({ x: -h, y: f(-h) })),
        direita: APROX.map((h) => ({ x: h, y: f(h) })),
        passos: [
          "Pela esquerda (x < 0), |x| = −x, então a fração vale −1.",
          "Pela direita (x > 0), |x| = x, então a fração vale 1.",
          "Os limites laterais são diferentes (−1 ≠ 1): o limite não existe.",
        ],
      };
    },
  },
  infinito: {
    nome: "No infinito",
    formula: () => "lim x→∞ (3x² + 1) / (x² + 2)",
    pedeA: false,
    calcular() {
      const f = (x) => (3 * x * x + 1) / (x * x + 2);
      return {
        existe: true, valor: 3,
        esquerda: [10, 100, 1000].map((x) => ({ x, y: f(x) })),
        direita: [],
        passos: [
          "Divida numerador e denominador por x², a maior potência.",
          "Fica (3 + 1/x²) / (1 + 2/x²); os termos com x no denominador vão a 0.",
          "Sobra 3 / 1 = 3: a função se aproxima de 3 quando x cresce.",
        ],
      };
    },
  },
};

// ───────── Derivadas (6 regras)
export const DERIVADAS = {
  constante: { nome: "Constante", regra: "d/dx (c) = 0", f: () => 55, df: () => 0, fTexto: "f(x) = 55", dfTexto: "f′(x) = 0" },
  potencia: { nome: "Potência", regra: "d/dx (xⁿ) = n·xⁿ⁻¹", f: (x) => x ** 3, df: (x) => 3 * x * x, fTexto: "f(x) = x³", dfTexto: "f′(x) = 3x²" },
  soma: { nome: "Soma", regra: "(f + g)′ = f′ + g′", f: (x) => 2 * x ** 3 - 5 * x + 10, df: (x) => 6 * x * x - 5, fTexto: "f(x) = 2x³ − 5x + 10", dfTexto: "f′(x) = 6x² − 5" },
  produto: { nome: "Produto", regra: "(f·g)′ = f′g + fg′", f: (x) => x * x * (x + 3), df: (x) => 2 * x * (x + 3) + x * x, fTexto: "f(x) = x²(x + 3)", dfTexto: "f′(x) = 2x(x + 3) + x²" },
  quociente: {
    nome: "Quociente", regra: "(f/g)′ = (f′g − fg′) / g²", f: (x) => (x * x + 1) / (x + 2), df: (x) => (x * x + 4 * x - 1) / (x + 2) ** 2,
    fTexto: "f(x) = (x² + 1) / (x + 2)", dfTexto: "f′(x) = (x² + 4x − 1) / (x + 2)²", proibido: (x) => (x === -2 ? "x = −2 zera o denominador: a função não existe aí." : null),
  },
  cadeia: { nome: "Cadeia", regra: "(f∘g)′ = f′(g(x))·g′(x)", f: (x) => 100 * (1 - Math.exp(-0.12 * x)), df: (x) => 12 * Math.exp(-0.12 * x), fTexto: "f(x) = 100(1 − e^(−0,12x))", dfTexto: "f′(x) = 12e^(−0,12x)" },
};

/** Derivada em x0: valor exato pela regra, conferência numérica e reta tangente. */
export function calcularDerivada(regra, x0) {
  const d = DERIVADAS[regra];
  const erro = d.proibido?.(x0);
  if (erro) return { ok: false, erro };
  const y0 = d.f(x0), inclinacao = d.df(x0), h = 1e-4;
  const numerica = (d.f(x0 + h) - d.f(x0 - h)) / (2 * h);
  return { ok: true, y0, inclinacao, numerica, tangente: (x) => y0 + inclinacao * (x - x0) };
}

// ───────── Integrais (5 indefinidas + 1 definida)
export const INTEGRAIS = {
  constante: { nome: "Constante", integral: "∫ 15 dx", primitiva: "15x + C", f: () => 15, F: (x) => 15 * x, regra: "A integral de uma constante é a constante vezes x.", a: 0, b: 4 },
  potencia: { nome: "Potência", integral: "∫ x³ dx", primitiva: "x⁴/4 + C", f: (x) => x ** 3, F: (x) => x ** 4 / 4, regra: "Some 1 ao expoente e divida pelo novo expoente.", a: 0, b: 2 },
  soma: { nome: "Soma", integral: "∫ (3x² − 2x + 5) dx", primitiva: "x³ − x² + 5x + C", f: (x) => 3 * x * x - 2 * x + 5, F: (x) => x ** 3 - x * x + 5 * x, regra: "Integre termo a termo e some.", a: 0, b: 2 },
  exponencial: { nome: "Exponencial", integral: "∫ e^(0,12x) dx", primitiva: "e^(0,12x) / 0,12 + C", f: (x) => Math.exp(0.12 * x), F: (x) => Math.exp(0.12 * x) / 0.12, regra: "Divida pela constante do expoente (0,12).", a: 0, b: 10 },
  trigonometrica: { nome: "Trigonométrica", integral: "∫ cos(x) dx", primitiva: "sen(x) + C", f: Math.cos, F: Math.sin, regra: "A derivada de sen(x) é cos(x).", a: 0, b: 1.5708 },
  definida: { nome: "Definida", integral: "∫ (50 + 20·sen(πx/7)) dx", primitiva: "50x − (140/π)·cos(πx/7) + C", f: (x) => 50 + 20 * Math.sin((Math.PI * x) / 7), F: (x) => 50 * x - (140 / Math.PI) * Math.cos((Math.PI * x) / 7), regra: "Integre a constante e o seno separadamente; o cosseno troca o sinal.", a: 0, b: 7 },
};

/** Regra de Simpson (n par), usada só para conferir o resultado exato. */
export function simpson(f, a, b, n = 200) {
  const h = (b - a) / n;
  let s = f(a) + f(b);
  for (let i = 1; i < n; i += 1) s += f(a + i * h) * (i % 2 ? 4 : 2);
  return (s * h) / 3;
}

export function calcularIntegral(tipo, a, b) {
  const I = INTEGRAIS[tipo];
  if (a === b) return { ok: true, valor: 0, numerica: 0 };
  return { ok: true, valor: I.F(b) - I.F(a), numerica: simpson(I.f, a, b) };
}

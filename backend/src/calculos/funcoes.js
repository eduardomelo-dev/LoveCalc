// Funções (5 tipos). Mesmas fórmulas e textos de frontend/js/math.js (FUNCOES).
import { arredondar } from "./numeros.js";

export const FUNCOES = {
  constant: {
    formula: "C(x) = 55",
    f: () => 55,
    dominio: "ℝ (todos os reais)",
    imagem: "{55}",
    explicacao: "A saída é sempre 55, seja qual for o x.",
  },
  linear: {
    formula: "A(x) = 40 + 3x",
    f: (x) => 40 + 3 * x,
    dominio: "ℝ (todos os reais)",
    imagem: "ℝ (todos os reais)",
    explicacao: "Cada unidade a mais em x soma 3 na saída (coeficiente angular 3).",
  },
  quadratic: {
    formula: "Q(x) = −0,04(x − 50)² + 100",
    f: (x) => -0.04 * (x - 50) ** 2 + 100,
    dominio: "ℝ (todos os reais)",
    imagem: "(−∞, 100]",
    explicacao: "Parábola com concavidade para baixo: o máximo é 100, no vértice x = 50.",
  },
  absolute: {
    formula: "M(x) = 100 − 2|x − 50|",
    f: (x) => 100 - 2 * Math.abs(x - 50),
    dominio: "ℝ (todos os reais)",
    imagem: "(−∞, 100]",
    explicacao: "A saída cai 2 a cada unidade de distância entre x e 50.",
  },
  exponential: {
    formula: "E(x) = 100(1 − e^(−0,12x))",
    f: (x) => 100 * (1 - Math.exp(-0.12 * x)),
    dominio: "ℝ (todos os reais)",
    imagem: "(−∞, 100)",
    explicacao: "Cresce rápido no começo e se aproxima de 100 sem nunca chegar (assíntota y = 100).",
  },
};

/** Valor em x, tabela de x − 2 até x + 2 e os textos da função. */
export function calcularFuncao(tipo, x) {
  const { formula, f, dominio, imagem, explicacao } = FUNCOES[tipo];
  const tabela = [-2, -1, 0, 1, 2].map((k) => ({ x: arredondar(x + k), y: arredondar(f(x + k)) }));
  return { formula, y: arredondar(f(x)), tabela, dominio, imagem, explicacao };
}

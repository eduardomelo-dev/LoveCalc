// Limites (3 casos). Mesmas contas e passos de frontend/js/math.js (LIMITES).
import { arredondar, formatNumber } from "./numeros.js";

// Distâncias usadas para chegar perto do ponto.
const APROX = [0.1, 0.01, 0.001];

// Ponto da tabela de aproximação, já arredondado.
const ponto = (f, x) => ({ x: arredondar(x), y: arredondar(f(x)) });

export const LIMITES = {
  removivel: {
    pedeA: true,
    formula: (a) => `lim x→${formatNumber(a)} (x² − ${formatNumber(a * a)}) / (x − ${formatNumber(a)})`,
    calcular(a) {
      const f = (x) => (x * x - a * a) / (x - a);
      return {
        existe: true,
        valor: arredondar(2 * a),
        esquerda: APROX.map((h) => ponto(f, a - h)),
        direita: APROX.map((h) => ponto(f, a + h)),
        passos: [
          `Em x = ${formatNumber(a)} a fração vira 0/0: indeterminada.`,
          `Fatore: x² − ${formatNumber(a * a)} = (x − ${formatNumber(a)})(x + ${formatNumber(a)}).`,
          `Simplifique (x − ${formatNumber(a)}) e substitua: ${formatNumber(a)} + ${formatNumber(a)} = ${formatNumber(2 * a)}.`,
        ],
      };
    },
  },
  lateral: {
    pedeA: false,
    formula: () => "lim x→0 |x| / x",
    calcular() {
      const f = (x) => Math.abs(x) / x;
      return {
        existe: false,
        valor: null,
        esquerda: APROX.map((h) => ponto(f, -h)),
        direita: APROX.map((h) => ponto(f, h)),
        passos: [
          "Pela esquerda (x < 0), |x| = −x, então a fração vale −1.",
          "Pela direita (x > 0), |x| = x, então a fração vale 1.",
          "Os limites laterais são diferentes (−1 ≠ 1): o limite não existe.",
        ],
      };
    },
  },
  infinito: {
    pedeA: false,
    formula: () => "lim x→∞ (3x² + 1) / (x² + 2)",
    calcular() {
      const f = (x) => (3 * x * x + 1) / (x * x + 2);
      return {
        existe: true,
        valor: 3,
        esquerda: [10, 100, 1000].map((x) => ponto(f, x)),
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

/** Resultado do limite com a fórmula na frente. `a` só é usado no caso removível. */
export function calcularLimite(caso, a) {
  const limite = LIMITES[caso];
  return { formula: limite.formula(a), ...limite.calcular(a) };
}

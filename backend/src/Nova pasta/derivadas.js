// Derivadas (6 regras). Mesmas fórmulas e textos de frontend/js/math.js (DERIVADAS).
import { arredondar } from "./numeros.js";
import { ErroApi } from "../validacao.js";

const H = 1e-4;

export const DERIVADAS = {
  constante: {
    regra: "d/dx (c) = 0",
    f: () => 55,
    df: () => 0,
    fTexto: "f(x) = 55",
    dfTexto: "f′(x) = 0",
  },
  potencia: {
    regra: "d/dx (xⁿ) = n·xⁿ⁻¹",
    f: (x) => x ** 3,
    df: (x) => 3 * x * x,
    fTexto: "f(x) = x³",
    dfTexto: "f′(x) = 3x²",
  },
  soma: {
    regra: "(f + g)′ = f′ + g′",
    f: (x) => 2 * x ** 3 - 5 * x + 10,
    df: (x) => 6 * x * x - 5,
    fTexto: "f(x) = 2x³ − 5x + 10",
    dfTexto: "f′(x) = 6x² − 5",
  },
  produto: {
    regra: "(f·g)′ = f′g + fg′",
    f: (x) => x * x * (x + 3),
    df: (x) => 2 * x * (x + 3) + x * x,
    fTexto: "f(x) = x²(x + 3)",
    dfTexto: "f′(x) = 2x(x + 3) + x²",
  },
  quociente: {
    regra: "(f/g)′ = (f′g − fg′) / g²",
    f: (x) => (x * x + 1) / (x + 2),
    df: (x) => (x * x + 4 * x - 1) / (x + 2) ** 2,
    fTexto: "f(x) = (x² + 1) / (x + 2)",
    dfTexto: "f′(x) = (x² + 4x − 1) / (x + 2)²",
    proibido: (x) => (x === -2 ? "x = −2 zera o denominador: a função não existe aí." : null),
  },
  cadeia: {
    regra: "(f∘g)′ = f′(g(x))·g′(x)",
    f: (x) => 100 * (1 - Math.exp(-0.12 * x)),
    df: (x) => 12 * Math.exp(-0.12 * x),
    fTexto: "f(x) = 100(1 − e^(−0,12x))",
    dfTexto: "f′(x) = 12e^(−0,12x)",
  },
};

/** Derivada exata em x0, conferência por diferença central (h = 0,0001) e reta tangente y = m·x + b. */
export function calcularDerivada(regra, x0) {
  const d = DERIVADAS[regra];
  const erro = d.proibido?.(x0);
  if (erro) throw new ErroApi(erro, 422);

  const y0 = d.f(x0);
  const inclinacao = d.df(x0);
  const numerica = (d.f(x0 + H) - d.f(x0 - H)) / (2 * H);
  const b = y0 - inclinacao * x0;

  return {
    formula: d.fTexto,
    derivada: d.dfTexto,
    regra: d.regra,
    y0: arredondar(y0),
    inclinacao: arredondar(inclinacao),
    numerica: arredondar(numerica),
    tangente: {
      m: arredondar(inclinacao),
      b: arredondar(b),
    },
  };
}

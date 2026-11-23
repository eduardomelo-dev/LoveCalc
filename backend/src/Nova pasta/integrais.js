// Integrais (5 indefinidas + 1 definida). Mesmas fórmulas e textos de frontend/js/math.js (INTEGRAIS).
import { arredondar } from "./numeros.js";

export const INTEGRAIS = {
  constante: {
    integral: "∫ 15 dx",
    primitiva: "15x + C",
    f: () => 15,
    F: (x) => 15 * x,
    regra: "A integral de uma constante é a constante vezes x.",
  },
  potencia: {
    integral: "∫ x³ dx",
    primitiva: "x⁴/4 + C",
    f: (x) => x ** 3,
    F: (x) => x ** 4 / 4,
    regra: "Some 1 ao expoente e divida pelo novo expoente.",
  },
  soma: {
    integral: "∫ (3x² − 2x + 5) dx",
    primitiva: "x³ − x² + 5x + C",
    f: (x) => 3 * x * x - 2 * x + 5,
    F: (x) => x ** 3 - x * x + 5 * x,
    regra: "Integre termo a termo e some.",
  },
  exponencial: {
    integral: "∫ e^(0,12x) dx",
    primitiva: "e^(0,12x) / 0,12 + C",
    f: (x) => Math.exp(0.12 * x),
    F: (x) => Math.exp(0.12 * x) / 0.12,
    regra: "Divida pela constante do expoente (0,12).",
  },
  trigonometrica: {
    integral: "∫ cos(x) dx",
    primitiva: "sen(x) + C",
    f: Math.cos,
    F: Math.sin,
    regra: "A derivada de sen(x) é cos(x).",
  },
  definida: {
    integral: "∫ (50 + 20·sen(πx/7)) dx",
    primitiva: "50x − (140/π)·cos(πx/7) + C",
    f: (x) => 50 + 20 * Math.sin((Math.PI * x) / 7),
    F: (x) => 50 * x - (140 / Math.PI) * Math.cos((Math.PI * x) / 7),
    regra: "Integre a constante e o seno separadamente; o cosseno troca o sinal.",
  },
};

/** Regra de Simpson (n par = 200), usada para conferir o resultado exato. */
export function simpson(f, a, b, n = 200) {
  const h = (b - a) / n;
  let s = f(a) + f(b);
  for (let i = 1; i < n; i += 1) {
    s += f(a + i * h) * (i % 2 ? 4 : 2);
  }
  return (s * h) / 3;
}

/** Integral de a até b: valor exato F(b) − F(a), conferência por Simpson, Fa e Fb. */
export function calcularIntegral(tipo, a, b) {
  const I = INTEGRAIS[tipo];
  const Fa = I.F(a);
  const Fb = I.F(b);
  const valor = a === b ? 0 : Fb - Fa;
  const numerica = a === b ? 0 : simpson(I.f, a, b);

  return {
    integral: I.integral,
    primitiva: I.primitiva,
    regra: I.regra,
    valor: arredondar(valor),
    numerica: arredondar(numerica),
    Fa: arredondar(Fa),
    Fb: arredondar(Fb),
  };
}

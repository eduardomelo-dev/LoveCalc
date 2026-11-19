// Ajudas para números: arredondar a saída e escrever no padrão brasileiro nos textos.

/** Arredonda em 10 casas (evita 9.899999999); infinito ou NaN vira null. */
export function arredondar(valor) {
  if (!Number.isFinite(valor)) return null;
  const r = Number(valor.toFixed(10));
  return r === 0 ? 0 : r; // evita -0
}

/** Igual ao formatNumber do front-end (frontend/js/math.js), para os textos saírem idênticos. */
export function formatNumber(value, casas = 2) {
  if (value === Infinity) return "+∞";
  if (value === -Infinity) return "−∞";
  return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: casas }).format(value).replace("-", "−");
}

// Validação das entradas. Qualquer problema vira um ErroApi (400 por padrão).
import { formatNumber } from "./calculos/numeros.js";

export const MIN = -1000;
export const MAX = 1000;

/** Erro com status HTTP e mensagem em português para o usuário. Use 422 quando a conta não existe. */
export class ErroApi extends Error {
  constructor(mensagem, status = 400) {
    super(mensagem);
    this.status = status;
  }
}

/** Corpo da requisição como objeto (vazio se não veio nada). */
export function lerCorpo(req) {
  const corpo = req.body;
  return corpo && typeof corpo === "object" && !Array.isArray(corpo) ? corpo : {};
}

/** Confere se o valor é uma das chaves de `opcoes` (ex.: o tipo da função). */
export function lerOpcao(valor, nome, opcoes) {
  if (typeof valor === "string" && Object.hasOwn(opcoes, valor)) return valor;
  const lista = Object.keys(opcoes);
  const texto = `${lista.slice(0, -1).join(", ")} ou ${lista.at(-1)}`;
  throw new ErroApi(`${cap(nome)} inválido: use ${texto}.`);
}

/** Confere se o valor é um número entre −1000 e 1000. */
export function lerNumero(valor, nome) {
  if (valor === undefined || valor === null || valor === "") throw new ErroApi(`Informe o valor de ${nome}.`);
  if (typeof valor !== "number" || !Number.isFinite(valor)) {
    throw new ErroApi(`O valor de ${nome} precisa ser um número.`);
  }
  if (valor < MIN || valor > MAX) {
    throw new ErroApi(`Use ${nome} entre ${formatNumber(MIN)} e ${formatNumber(MAX)}.`);
  }
  return valor;
}

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

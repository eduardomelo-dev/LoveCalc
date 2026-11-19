// POST /api/funcoes/calcular  { "tipo": "quadratic", "x": 10 }
import { Router } from "express";

import { FUNCOES, calcularFuncao } from "../calculos/funcoes.js";
import { lerCorpo, lerNumero, lerOpcao } from "../validacao.js";

const rotas = Router();

rotas.post("/calcular", (req, res) => {
  const corpo = lerCorpo(req);
  const tipo = lerOpcao(corpo.tipo, "tipo", FUNCOES);
  const x = lerNumero(corpo.x, "x");
  res.json(calcularFuncao(tipo, x));
});

export default rotas;

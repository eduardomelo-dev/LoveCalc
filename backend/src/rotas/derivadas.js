// POST /api/derivadas/calcular  { "regra": "potencia", "x0": 1 }
import { Router } from "express";

import { DERIVADAS, calcularDerivada } from "../calculos/derivadas.js";
import { lerCorpo, lerNumero, lerOpcao } from "../validacao.js";

const rotas = Router();

rotas.post("/calcular", (req, res) => {
  const corpo = lerCorpo(req);
  const regra = lerOpcao(corpo.regra, "regra", DERIVADAS);
  const x0 = lerNumero(corpo.x0, "x0");
  res.json(calcularDerivada(regra, x0));
});

export default rotas;

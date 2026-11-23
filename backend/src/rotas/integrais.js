// POST /api/integrais/calcular  { "tipo": "definida", "a": 0, "b": 7 }
import { Router } from "express";

import { INTEGRAIS, calcularIntegral } from "../calculos/integrais.js";
import { lerCorpo, lerNumero, lerOpcao } from "../validacao.js";

const rotas = Router();

rotas.post("/calcular", (req, res) => {
  const corpo = lerCorpo(req);
  const tipo = lerOpcao(corpo.tipo, "tipo", INTEGRAIS);
  const a = lerNumero(corpo.a, "a");
  const b = lerNumero(corpo.b, "b");
  res.json(calcularIntegral(tipo, a, b));
});

export default rotas;

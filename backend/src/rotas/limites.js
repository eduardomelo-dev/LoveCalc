// POST /api/limites/calcular  { "caso": "removivel", "a": 5 }
import { Router } from "express";

import { LIMITES, calcularLimite } from "../calculos/limites.js";
import { lerCorpo, lerNumero, lerOpcao } from "../validacao.js";

const rotas = Router();

rotas.post("/calcular", (req, res) => {
  const corpo = lerCorpo(req);
  const caso = lerOpcao(corpo.caso, "caso", LIMITES);
  // "a" é obrigatório só no removível; nos outros casos é ignorado.
  const a = LIMITES[caso].pedeA ? lerNumero(corpo.a, "a") : undefined;
  res.json(calcularLimite(caso, a));
});

export default rotas;

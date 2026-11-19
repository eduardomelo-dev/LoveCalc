// GET /api/saude: o front-end usa para saber se a API está no ar.
import { Router } from "express";

const rotas = Router();

rotas.get("/", (req, res) => {
  res.json({ ok: true });
});

export default rotas;

// Monta o Express: CORS, leitura do JSON, rotas e tratamento de erros.
import express from "express";

import { ErroApi } from "./validacao.js";
import rotasSaude from "./rotas/saude.js";
import rotasFuncoes from "./rotas/funcoes.js";
import rotasLimites from "./rotas/limites.js";

// Endereço do front-end em desenvolvimento (python -m http.server 4173).
export const ORIGEM_FRONT = "http://localhost:4173";

export const app = express();
app.disable("x-powered-by");

// CORS: libera o front-end e responde à pré-checagem (OPTIONS) do navegador.
app.use((req, res, next) => {
  res.set("Access-Control-Allow-Origin", ORIGEM_FRONT);
  res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

app.use(express.json());

// Rotas (derivadas e integrais entram aqui, uma linha cada).
app.use("/api/saude", rotasSaude);
app.use("/api/funcoes", rotasFuncoes);
app.use("/api/limites", rotasLimites);

// Rota que não existe.
app.use((req, res) => {
  res.status(404).json({ erro: "Rota não encontrada." });
});

// Erros: validação (400), conta impossível (422), JSON quebrado (400) e o resto (500).
app.use((erro, req, res, next) => {
  if (erro instanceof ErroApi) return res.status(erro.status).json({ erro: erro.message });
  if (erro.type === "entity.parse.failed") {
    return res.status(400).json({ erro: "O corpo da requisição não é um JSON válido." });
  }
  if (erro.status >= 400 && erro.status < 500) {
    return res.status(erro.status).json({ erro: "Requisição inválida." });
  }
  console.error(erro);
  res.status(500).json({ erro: "Erro interno no servidor." });
});

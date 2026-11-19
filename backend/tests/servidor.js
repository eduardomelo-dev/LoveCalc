// Ajuda dos testes: liga a API numa porta livre e faz as requisições com o fetch do Node.
import { before, after } from "node:test";

import { app } from "../src/app.js";

export function usarServidor() {
  const api = { url: "" };
  let servidor;

  before(async () => {
    servidor = await new Promise((pronto) => {
      const s = app.listen(0, () => pronto(s));
    });
    api.url = `http://localhost:${servidor.address().port}`;
  });

  after(() => new Promise((fim) => servidor.close(fim)));

  /** POST com corpo JSON (objeto) ou texto cru (string, para testar JSON quebrado). */
  api.post = async (rota, corpo) => {
    const resposta = await fetch(api.url + rota, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: typeof corpo === "string" ? corpo : JSON.stringify(corpo),
    });
    return { status: resposta.status, headers: resposta.headers, corpo: await resposta.json() };
  };

  api.get = async (rota) => {
    const resposta = await fetch(api.url + rota);
    return { status: resposta.status, headers: resposta.headers, corpo: await resposta.json() };
  };

  return api;
}

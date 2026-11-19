// Só liga a porta. Tudo o que a API faz está em app.js.
import { app } from "./app.js";

const porta = Number(process.env.PORT) || 3000;

app.listen(porta, () => {
  console.log(`API do LoveCalc no ar: http://localhost:${porta}/api/saude`);
});

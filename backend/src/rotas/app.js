// ... imports existentes ...
import rotasSaude from "./rotas/saude.js";
import rotasFuncoes from "./rotas/funcoes.js";
import rotasLimites from "./rotas/limites.js";
import rotasDerivadas from "./rotas/derivadas.js";
import rotasIntegrais from "./rotas/integrais.js";

// ... código do CORS e express.json() inalterado ...

// Rotas da API.
app.use("/api/saude", rotasSaude);
app.use("/api/funcoes", rotasFuncoes);
app.use("/api/limites", rotasLimites);
app.use("/api/derivadas", rotasDerivadas);
app.use("/api/integrais", rotasIntegrais);

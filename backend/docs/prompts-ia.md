# Registro dos prompts de IA — back-end (Funções e Limites)

- **Data:** 19/11/2026
- **Ferramenta:** Claude Code (modelo Claude Opus 5.5), dentro do VS Code
- **Escopo:** só os módulos de Funções e Limites do back-end. Derivadas e Integrais ficam com outra pessoa.

## Prompt principal

> Você vai implementar o BACKEND do projeto LoveCalc, nesta pasta (repositório com frontend/ e backend/). Minha parte é SOMENTE os módulos de Funções e Limites. Derivadas e integrais são de outra pessoa e NÃO devem ser criadas.
>
> Leia antes de codar:
> 1. backend/README.md: é o contrato da API (rotas, entradas, respostas, erros). Siga-o exatamente.
> 2. frontend/js/math.js: fonte das contas e dos textos (FUNCOES e LIMITES). O backend deve devolver os mesmos resultados, com as mesmas fórmulas, domínio, imagem, explicação e passos, palavra por palavra.
> 3. frontend/tests/math.test.js: referência dos testes. Os mesmos números de entrada devem dar os mesmos resultados.
> 4. frontend/PRODUCT.md: restrições da entrega (testes, documentação, histórico de commits e registro dos prompts de IA).
>
> O que criar em backend/ (Node.js + Express, JavaScript com ES modules, "type": "module", como o front):
> - GET /api/saude, POST /api/funcoes/calcular (tipos: constant, linear, quadratic, absolute, exponential) e POST /api/limites/calcular (casos: removivel, lateral, infinito).
> - Respeite o contrato: JSON com ponto decimal; entradas de -1000 a 1000; HTTP 400 com {erro} em português para qualquer validação (tipo ou caso inválido, x ausente, valor não numérico, fora do intervalo, JSON inválido; "a" é obrigatório só em removivel); HTTP 422 quando a conta não existe (não deve ocorrer nestas duas rotas); valores infinitos viram null; CORS liberado para http://localhost:4173; porta pela variável PORT (padrão 3000).
> - Arredonde os números de saída em 10 casas decimais, para não aparecer 9.899999999.
> - Organização simples, para eu explicar na apresentação e para o colega acrescentar derivadas e integrais depois sem conflito: src/app.js (monta o Express e exporta o app), src/server.js (só liga a porta), src/rotas/saude.js, src/rotas/funcoes.js, src/rotas/limites.js, src/calculos/funcoes.js e src/calculos/limites.js. Nomes e comentários curtos em português. Nenhuma dependência além do express (e do cors, se quiser).
>
> Testes (npm test, com node:test e o fetch do Node, sem bibliotecas extras): cubra os 5 tipos de função, a tabela (x-2 até x+2), os 3 limites (valor, existe, esquerda, direita e passos), os erros 400 e o cabeçalho de CORS. Use os números do math.test.js (ex.: linear em x=10 dá 70 e a tabela [64,67,70,73,76]; removivel com a=5 dá 10; lateral dá existe=false com -1 e 1; infinito dá 3) e confira também os exemplos de resposta do README do contrato.
>
> Documentação: atualize backend/README.md (troque "ainda não existe" por como instalar e rodar: npm install, npm start, npm test; mantenha o contrato) e crie backend/docs/prompts-ia.md com a data, este prompt e um resumo do que foi feito.
>
> Não altere nada em frontend/. Faça commits pequenos e claros em português (feat:, test:, docs:), sem push. No final, rode npm test, suba o servidor, teste as rotas com curl e me diga em poucas linhas como rodar e o que falta para o front passar a usar a API (frontend/js/api.js, como descrito no contrato).

## Prompts seguintes (mesma conversa)

1. "o repositorio esta no meu git, vc tem acesso ao meu github" (a pasta aberta no VS Code não era o repositório).
2. "https://github.com/eduardomelo-dev/LoveCalc" (o repositório foi clonado a partir desse link).

## Resumo do que foi feito

- **Estrutura:** `src/app.js` (Express, CORS para `http://localhost:4173`, leitura do JSON, rotas, erros em
  `{ erro }`), `src/server.js` (porta pela variável `PORT`, padrão 3000), uma rota por arquivo em `src/rotas/`
  e as contas em `src/calculos/`. Foram acrescentados dois arquivos pequenos de apoio:
  `src/calculos/numeros.js` (arredondar em 10 casas, infinito vira `null`, e o mesmo `formatNumber` do front)
  e `src/validacao.js` (`lerNumero`, `lerOpcao` e `ErroApi`), que o colega pode reaproveitar em derivadas e integrais.
- **Rotas:** `GET /api/saude`, `POST /api/funcoes/calcular` e `POST /api/limites/calcular`, com as fórmulas,
  domínio, imagem, explicação e passos copiados de `frontend/js/math.js`. As respostas também trazem o campo
  `formula`.
- **Validação (400):** tipo ou caso inválido, número ausente, não numérico ou fora de −1000 a 1000, JSON
  inválido; `a` só é exigido no caso removível. Rota inexistente dá 404 em JSON.
- **Testes (`npm test`, 29 testes):** os cinco tipos de função, a tabela, os três limites, os exemplos do
  README, os erros 400, o CORS (inclusive a pré-checagem OPTIONS) e o arredondamento. `paridade.test.js`
  importa `frontend/js/math.js` (só leitura) e confere que a API dá os mesmos números e textos em várias entradas.
- **Única dependência:** `express`. O CORS foi feito à mão (quatro linhas em `app.js`).
- **Não alterado:** nada em `frontend/`.

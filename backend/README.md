# LoveCalc — back-end (ainda não existe)

Esta pasta está reservada para o back-end. Hoje o front-end faz todas as contas sozinho, em
[`frontend/js/math.js`](../frontend/js/math.js). O back-end vai assumir essa parte. Este documento é o
**contrato** que o front-end espera: com ele, os dois lados podem ser feitos em paralelo.

A linguagem e o framework ficam a critério de quem desenvolver (por exemplo, Node + Express ou Python + FastAPI).

## Regras gerais

- Base: `/api`. Requisições e respostas em JSON (`Content-Type: application/json`), números em ponto decimal (`2.5`).
- Entradas numéricas aceitas: de **−1000 a 1000** (o mesmo limite do front-end).
- Erro de validação: **HTTP 400** com `{ "erro": "mensagem em português para mostrar ao usuário" }`.
- Ponto onde a conta não existe (ex.: divisão por zero): **HTTP 422** com `{ "erro": "..." }`.
- Liberar CORS para o endereço do front-end (em desenvolvimento, `http://localhost:4173`).
- Valores infinitos: mandar `null` e explicar no campo de texto.

## Rotas

### `GET /api/saude`
Para o front-end saber se a API está no ar. Resposta: `{ "ok": true }`.

### `POST /api/funcoes/calcular`
Entrada: `{ "tipo": "quadratic", "x": 10 }`, em que `tipo` é um de `constant`, `linear`, `quadratic`, `absolute` ou `exponential`.

| tipo | função |
|---|---|
| `constant` | C(x) = 55 |
| `linear` | A(x) = 40 + 3x |
| `quadratic` | Q(x) = −0,04(x − 50)² + 100 |
| `absolute` | M(x) = 100 − 2\|x − 50\| |
| `exponential` | E(x) = 100(1 − e^(−0,12x)) |

Resposta:
```json
{
  "y": 36,
  "tabela": [{ "x": 8, "y": 29.44 }, { "x": 9, "y": 32.76 }, { "x": 10, "y": 36 }, { "x": 11, "y": 39.16 }, { "x": 12, "y": 42.24 }],
  "dominio": "ℝ (todos os reais)",
  "imagem": "(−∞, 100]",
  "explicacao": "Parábola com concavidade para baixo: o máximo é 100, no vértice x = 50."
}
```
A `tabela` traz x − 2 até x + 2, de 1 em 1.

### `POST /api/limites/calcular`
Entrada: `{ "caso": "removivel", "a": 5 }`, em que `caso` é um de `removivel`, `lateral` ou `infinito`. O `a` só vale para `removivel`.

| caso | limite |
|---|---|
| `removivel` | lim x→a (x² − a²)/(x − a) = 2a |
| `lateral` | lim x→0 \|x\|/x (não existe: −1 pela esquerda, 1 pela direita) |
| `infinito` | lim x→∞ (3x² + 1)/(x² + 2) = 3 |

Resposta:
```json
{
  "existe": true,
  "valor": 10,
  "esquerda": [{ "x": 4.9, "y": 9.9 }, { "x": 4.99, "y": 9.99 }, { "x": 4.999, "y": 9.999 }],
  "direita": [{ "x": 5.1, "y": 10.1 }, { "x": 5.01, "y": 10.01 }, { "x": 5.001, "y": 10.001 }],
  "passos": ["Em x = 5 a fração vira 0/0: indeterminada.", "Fatore: …", "Simplifique …"]
}
```
Se o limite não existe: `"existe": false, "valor": null`. No caso `infinito`, `esquerda` traz x = 10, 100 e 1000, e `direita` vem vazia.

### `POST /api/derivadas/calcular`
Entrada: `{ "regra": "potencia", "x0": 1 }`, em que `regra` é uma de `constante`, `potencia`, `soma`, `produto`, `quociente` ou `cadeia`.

| regra | f(x) | f′(x) |
|---|---|---|
| `constante` | 55 | 0 |
| `potencia` | x³ | 3x² |
| `soma` | 2x³ − 5x + 10 | 6x² − 5 |
| `produto` | x²(x + 3) | 2x(x + 3) + x² |
| `quociente` | (x² + 1)/(x + 2) | (x² + 4x − 1)/(x + 2)² |
| `cadeia` | 100(1 − e^(−0,12x)) | 12e^(−0,12x) |

Resposta:
```json
{ "y0": 1, "inclinacao": 3, "numerica": 3.00000001, "tangente": { "m": 3, "b": -2 } }
```
`numerica` é a conferência por diferença central com h = 0,0001. A tangente é `y = m·x + b`.
No `quociente` com x0 = −2, responder **422** (o denominador zera).

### `POST /api/integrais/calcular`
Entrada: `{ "tipo": "definida", "a": 0, "b": 7 }`, em que `tipo` é um de `constante`, `potencia`, `soma`, `exponencial`, `trigonometrica` ou `definida`.

| tipo | f(x) | primitiva F(x) |
|---|---|---|
| `constante` | 15 | 15x |
| `potencia` | x³ | x⁴/4 |
| `soma` | 3x² − 2x + 5 | x³ − x² + 5x |
| `exponencial` | e^(0,12x) | e^(0,12x)/0,12 |
| `trigonometrica` | cos(x) | sen(x) |
| `definida` | 50 + 20·sen(πx/7) | 50x − (140/π)·cos(πx/7) |

Resposta:
```json
{ "valor": 439.1268, "numerica": 439.1268, "Fa": -44.5634, "Fb": 394.5634 }
```
`valor` = F(b) − F(a); `numerica` é a conferência pela regra de Simpson com n = 200. Se a = b, o valor é 0.

## Como o front-end vai trocar para a API

1. Criar `frontend/js/api.js` com uma função por rota (`fetch` + tratamento de erro).
2. Em `frontend/js/app.js`, trocar as chamadas de `calculateFunction`/`tabelaFuncao`, `LIMITES[caso].calcular`,
   `calcularDerivada` e `calcularIntegral` pelas funções do `api.js`.
3. Manter `math.js` como reserva: se `GET /api/saude` falhar, a calculadora continua funcionando offline.
4. Os textos das fórmulas e as funções usadas para desenhar o gráfico continuam no front-end.

Os testes de `frontend/tests/math.test.js` servem de referência para os testes do back-end: os mesmos
números de entrada devem dar os mesmos resultados.

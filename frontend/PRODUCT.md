# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

O grupo da disciplina de Cálculo Diferencial e Integral (Engenharia de Software, UniCatólica-RN) apresenta a calculadora em sala, projetada num telão a partir de um notebook, para a professora avaliar. Quem opera é um integrante do grupo; quem lê é a turma e a professora, à distância.

## Product Purpose

Calculadora didática de CDI com quatro módulos executáveis: Funções (5 tipos, com domínio, imagem, tabela e gráfico), Limites (removível e inexistente, com limites laterais), Derivadas (6 regras) e Integrais (5 regras indefinidas + 1 definida). Cada módulo mostra a fórmula, os valores usados, o resultado e uma explicação curta. O sucesso é a professora conseguir conferir cada cálculo na tela e o grupo demonstrar os quatro módulos sem rolar página nem se perder.

## Positioning

É uma calculadora, não um site: uma tela só, com abas que alternam os módulos. Os resultados são calculados de verdade a partir das entradas (não são textos fixos).

## Constraints

- Somente front-end (HTML, CSS e JavaScript puro, sem dependências); o back-end será feito por outra pessoa e poderá substituir `js/math.js` por chamadas `fetch`.
- Deve caber numa tela de notebook projetada (sem rolagem da página no desktop), com texto legível de longe.
- Entradas validadas (vazias, fora do intervalo, divisão por zero).
- Entrega exige testes (`npm test`), documentação, histórico de commits e registro dos prompts de IA.
- Tema Doce Amor só como identidade discreta (nome e cores); sem artes do jogo, sem tela de compatibilidade de nomes (decisão do grupo, 2026-11-17).
- Animação de cursores 3D montando os blocos ao trocar de aba, só no desktop, sem bloquear cliques. Ligada por padrão mesmo com os efeitos de animação do Windows desligados (o notebook do dono tem esse ajuste); um botão "Animações" na barra liga e desliga todas as animações (cursores, gráfico, visor) e lembra a escolha.

## Voice

pt-BR, direto e didático: frases curtas que explicam o passo do cálculo.

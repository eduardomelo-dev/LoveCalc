// Dicas de cada aba, mostradas no canto do visor (uma por vez, em ordem). Curtas: cabem no cartão sem rolar.
export const DICAS = {
  funcoes: [
    "Função: cada x tem um único y. Se um x der dois resultados, não é função.",
    "Na quadrática, a > 0 abre para cima (mínimo); a < 0 abre para baixo (máximo).",
    "O vértice da parábola fica em x = −b/(2a).",
    "Na afim, o coeficiente angular é quanto y muda quando x anda 1.",
    "A exponencial cresce multiplicando, por isso dispara rápido.",
  ],
  limites: [
    "Limite é para onde f(x) vai quando x se aproxima, não o valor no ponto.",
    "Deu 0/0? É indeterminação: fatore e simplifique antes de substituir.",
    "O limite só existe se pela esquerda e pela direita der o mesmo valor.",
    "No infinito, olhe os termos de maior grau: são eles que mandam.",
    "Um buraco no gráfico não impede o limite de existir.",
  ],
  derivadas: [
    "Derivada é a inclinação da reta tangente naquele ponto.",
    "Regra da potência: (xⁿ)′ = n·xⁿ⁻¹.",
    "f′ > 0: sobe. f′ < 0: desce. f′ = 0: possível máximo ou mínimo.",
    "Regra da cadeia: derive a de fora e multiplique pela derivada da de dentro.",
    "Regra do produto: (f·g)′ = f′·g + f·g′.",
  ],
  integrais: [
    "Integral definida é a área sob a curva; abaixo do eixo x conta negativo.",
    "Mais retângulos na soma de Riemann, mais perto da área exata.",
    "Integrar é desfazer a derivada. Na indefinida, não esqueça o + C.",
    "Teorema Fundamental: a área de a até b é F(b) − F(a).",
    "∫ xⁿ dx = xⁿ⁺¹/(n+1) + C, com n ≠ −1.",
  ],
};

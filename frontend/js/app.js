import {
  FUNCOES, calculateFunction, tabelaFuncao, LIMITES, DERIVADAS, calcularDerivada, INTEGRAIS, calcularIntegral, lerNumero, formatNumber,
} from "./math.js";
import { drawGraph, autoRange } from "./graph.js";
import { CursorOrchestra, animacoesLigadas, definirAnimacoes } from "./cursor-orchestra.js";
import { DICAS } from "./dicas.js";

const $ = (s) => document.querySelector(s);
const fmt = formatNumber;

// ───────── cada aba: opções, campos e a conta (tudo o que aparece na tela sai daqui)
const MODULOS = {
  funcoes: {
    titulo: "Funções", descricao: "Escolha o tipo, informe x e veja a saída, a tabela e o gráfico.", legenda: "Tipo de função",
    opcoes: Object.entries(FUNCOES).map(([id, f]) => ({ id, nome: f.nome, sub: f.formula })),
    campos: () => [{ id: "x", rotulo: "Valor de x", padrao: "10", min: -100, max: 100 }],
    calcular(id, v) {
      const F = FUNCOES[id], x = v.x, y = calculateFunction(id, x);
      const r = F.intervalo, range = { ...r, xMin: Math.min(r.xMin, x - 2), xMax: Math.max(r.xMax, x + 2) };
      Object.assign(range, autoRange(F.f, range.xMin, range.xMax, [y, r.yMin, r.yMax]));
      return {
        expressao: `${F.letra}(${fmt(x)})`, valor: fmt(y, 4), numero: y, nota: F.explica(x),
        passos: [`Fórmula: ${F.formula}.`, `Substitua x por ${fmt(x)}.`, `Resultado: ${F.letra}(${fmt(x)}) = ${fmt(y, 4)}.`],
        dados: [["Domínio", F.dominio, true], ["Imagem", F.imagem, true]],
        tabela: { titulo: "Entradas e saídas", cols: ["x", `${F.letra}(x)`], linhas: tabelaFuncao(id, x).map((p) => [fmt(p.x), fmt(p.y, 2)]), atual: 2 },
        grafico: { f: F.f, range, points: [{ x, y }] }, arrastar: { campos: ["x"], alvo: "ponto" },
        legenda: [["curva", F.formula], ["ponto", `(${fmt(x)}; ${fmt(y, 2)})`]],
      };
    },
  },
  limites: {
    titulo: "Limites", descricao: "Veja para onde a função vai quando x se aproxima de um valor.", legenda: "Caso",
    opcoes: Object.entries(LIMITES).map(([id, l]) => ({ id, nome: l.nome, sub: l.formula(5) })),
    campos: (id) => (LIMITES[id].pedeA ? [{ id: "a", rotulo: "x tende a (a)", padrao: "5", min: -50, max: 50 }] : []),
    calcular(id, v) {
      const L = LIMITES[id], a = v.a ?? 5, r = L.calcular(a);
      const lado = (pts, nome) => pts.map((p) => [fmt(p.x, 4), fmt(p.y, 4), nome]);
      const linhas = [...lado(r.esquerda, id === "infinito" ? "x → ∞" : "esquerda"), ...lado(r.direita, "direita")];
      let grafico, legenda;
      if (id === "removivel") {
        const f = (x) => (x * x - a * a) / (x - a);
        grafico = { f, range: autoRange((x) => x + a, a - 6, a + 6), holes: [{ x: a, y: 2 * a }] };
        legenda = [["curva", "f(x)"], ["buraco", `buraco em (${fmt(a)}; ${fmt(2 * a)})`]];
      } else if (id === "lateral") {
        grafico = { f: (x) => Math.abs(x) / x, range: { xMin: -4, xMax: 4, yMin: -2, yMax: 2 }, holes: [{ x: 0, y: -1 }, { x: 0, y: 1 }] };
        legenda = [["curva", "|x| / x"], ["buraco", "saltos em x = 0"]];
      } else {
        const f = (x) => (3 * x * x + 1) / (x * x + 2);
        grafico = { f, range: { xMin: 0, xMax: 20, yMin: 0, yMax: 3.6 }, tangent: () => 3 };
        legenda = [["curva", "f(x)"], ["tangente", "assíntota y = 3"]];
      }
      return {
        expressao: L.formula(a), valor: r.existe ? fmt(r.valor, 4) : "não existe", numero: r.existe ? r.valor : null, texto: !r.existe,
        nota: r.existe ? "O limite existe: os valores da tabela se aproximam dele." : "Pela esquerda e pela direita a função vai para valores diferentes.",
        passos: r.passos,
        dados: id === "infinito" ? [["Comportamento", "f(x) → 3 quando x → ∞"]] : [["Limite pela esquerda", fmt(r.esquerda.at(-1).y, 3)], ["Limite pela direita", fmt(r.direita.at(-1).y, 3)]],
        tabela: { titulo: "Aproximação numérica", cols: ["x", "f(x)", "lado"], linhas },
        grafico, legenda,
        cena: id === "infinito" ? { tipo: "infinito", f: grafico.f, de: 0.5, ate: 19.5 } : { tipo: "aproximar", f: grafico.f, alvo: id === "removivel" ? a : 0, de: id === "removivel" ? 4.5 : 3.6 },
        arrastar: id === "removivel" ? { campos: ["a"], alvo: "buraco" } : null,
      };
    },
  },
  derivadas: {
    titulo: "Derivadas", descricao: "Escolha a regra e um ponto: a derivada é a inclinação da reta tangente.", legenda: "Regra de derivação",
    opcoes: Object.entries(DERIVADAS).map(([id, d]) => ({ id, nome: d.nome, sub: d.fTexto })),
    campos: () => [{ id: "x", rotulo: "Ponto x₀", padrao: "1", min: -20, max: 20 }],
    calcular(id, v) {
      const D = DERIVADAS[id], x0 = v.x, r = calcularDerivada(id, x0);
      if (!r.ok) return { erro: r.erro, expressao: `f′(${fmt(x0)})`, grafico: { f: D.f, range: { xMin: x0 - 6, xMax: x0 + 6, yMin: -30, yMax: 30 } }, legenda: [["curva", D.fTexto], ["buraco", `sem valor em x = ${fmt(x0)}`]] };
      return {
        expressao: `f′(${fmt(x0)})`, valor: fmt(r.inclinacao, 4), numero: r.inclinacao, nota: `Regra: ${D.regra}`,
        passos: [`${D.fTexto}.`, `Aplique a regra: ${D.regra}.`, `${D.dfTexto}.`, `Em x₀ = ${fmt(x0)}: f′ = ${fmt(r.inclinacao, 4)}.`],
        dados: [["f(x₀)", fmt(r.y0, 4)], ["f′(x₀)", fmt(r.inclinacao, 4)], ["Conferência numérica", fmt(r.numerica, 4)], ["Reta tangente", `y = ${fmt(r.y0, 2)} ${r.inclinacao < 0 ? "−" : "+"} ${fmt(Math.abs(r.inclinacao), 2)}(x ${x0 < 0 ? "+" : "−"} ${fmt(Math.abs(x0))})`, true]],
        grafico: { f: D.f, range: autoRange(D.f, x0 - 4, x0 + 4, [r.y0]), tangent: r.tangente, points: [{ x: x0, y: r.y0 }] },
        cena: { tipo: "secante", f: D.f, x0, inclinacao: r.inclinacao }, arrastar: { campos: ["x"], alvo: "ponto" },
        legenda: [["curva", D.fTexto], ["tangente", "reta tangente"], ["ponto", `x₀ = ${fmt(x0)}`]],
      };
    },
  },
  integrais: {
    titulo: "Integrais", descricao: "Escolha a regra e os limites a e b: a integral é a área acumulada.", legenda: "Regra de integração",
    opcoes: Object.entries(INTEGRAIS).map(([id, i]) => ({ id, nome: i.nome, sub: i.integral })),
    campos: (id) => [
      { id: "a", rotulo: "De a", padrao: String(INTEGRAIS[id].a).replace(".", ","), min: -50, max: 50 },
      { id: "b", rotulo: "Até b", padrao: String(INTEGRAIS[id].b).replace(".", ","), min: -50, max: 50 },
    ],
    calcular(id, v) {
      const I = INTEGRAIS[id], { a, b } = v, r = calcularIntegral(id, a, b);
      const lo = Math.min(a, b), hi = Math.max(a, b), m = Math.max(1, (hi - lo) * 0.2);
      return {
        expressao: `${I.integral.replace("∫", `∫[${fmt(a)}; ${fmt(b)}]`)}`, valor: fmt(r.valor, 4), numero: r.valor, nota: `Primitiva: F(x) = ${I.primitiva}`,
        passos: [`Primitiva: F(x) = ${I.primitiva}.`, I.regra, `F(${fmt(b)}) − F(${fmt(a)}) = ${fmt(I.F(b), 4)} − ${I.F(a) < 0 ? `(${fmt(I.F(a), 4)})` : fmt(I.F(a), 4)} = ${fmt(r.valor, 4)}.`],
        dados: [["F(b)", fmt(I.F(b), 4)], ["F(a)", fmt(I.F(a), 4)], ["Conferência (Simpson)", fmt(r.numerica, 4)]],
        grafico: { f: I.f, range: autoRange(I.f, lo - m, hi + m, [0]), area: { a: lo, b: hi } },
        cena: { tipo: "riemann", f: I.f, a: lo, b: hi, exato: r.valor }, arrastar: { campos: ["a", "b"], alvo: "bordas" },
        legenda: [["curva", I.integral.replace("∫ ", "").replace(" dx", "")], ["area", `área de ${fmt(a)} a ${fmt(b)}`]],
      };
    },
  },
};

// ───────── estado e tela
// abre cada aba na opção que melhor mostra a ideia (a constante deixa a secante e os retângulos planos)
const estado = { aba: "funcoes", opcao: { funcoes: "quadratic", derivadas: "potencia", integrais: "definida" }, valores: {} };
const orquestra = new CursorOrchestra();
const pecas = [...document.querySelectorAll(".peca")];
let ultimo = null, ultimaAba = null;

// ───────── dica do assunto no canto do visor (uma por vez; avança ao trocar de aba ou no botão)
const dicaIdx = {};
function mostrarDica() {
  const lista = DICAS[estado.aba];
  if (!lista?.length) return;
  const i = dicaIdx[estado.aba] ?? 0;
  dicaIdx[estado.aba] = (i + 1) % lista.length;
  trocarTexto($("#dica-texto"), lista[i]);
}
$("#dica-proxima").addEventListener("click", mostrarDica);

function cores() {
  const css = getComputedStyle(document.documentElement), v = (n) => css.getPropertyValue(n).trim();
  return { grade: "#34192a", rotulo: v("--tinta-2"), eixo: v("--tinta-2"), curva: v("--acento"), brilho: "rgba(255,92,147,.18)", tangente: "#c89bff", area: "rgba(255,92,147,.08)", areaForte: "rgba(255,92,147,.32)", retangulo: "rgba(255,92,147,.34)", retangulo2: "rgba(255,92,147,.22)", secante: "#ffb454", esquerda: "#c89bff", direita: "#ff5c93", mira: "rgba(255,241,246,.4)", ponto: "#fff1f6", fundo: v("--superficie") };
}
const COR_LEGENDA = { curva: "var(--acento)", tangente: "#c89bff", ponto: "#fff1f6", area: "rgba(255,92,147,.4)", buraco: "var(--acento)" };

function opcaoAtual() {
  const M = MODULOS[estado.aba];
  return estado.opcao[estado.aba] ?? M.opcoes[0].id;
}
function valoresDe(chave, campos) {
  estado.valores[chave] ??= Object.fromEntries(campos.map((c) => [c.id, c.padrao]));
  return estado.valores[chave];
}

function montarAba() {
  const M = MODULOS[estado.aba], op = opcaoAtual();
  $("#titulo-modulo").textContent = M.titulo;
  $("#descricao-modulo").textContent = M.descricao;
  $("#legenda-opcoes").textContent = M.legenda;
  mostrarDica();
  const lista = $("#lista-opcoes");
  lista.setAttribute("role", "radiogroup");
  lista.innerHTML = M.opcoes.map((o) => `<button type="button" class="opcao" role="radio" aria-checked="${o.id === op}" tabindex="${o.id === op ? 0 : -1}" data-opcao="${o.id}">${o.nome}<small>${o.sub}</small></button>`).join("");
  montarCampos();
}

function montarCampos() {
  const M = MODULOS[estado.aba], op = opcaoAtual(), campos = M.campos(op), chave = `${estado.aba}:${op}`, vals = valoresDe(chave, campos);
  $("#campos").innerHTML = campos.map((c) => `<div class="campo"><label for="campo-${c.id}">${c.rotulo}</label>
    <input id="campo-${c.id}" name="${c.id}" inputmode="decimal" autocomplete="off" value="${vals[c.id]}" aria-describedby="erro-${c.id}" />
    <p class="erro" id="erro-${c.id}" role="alert"></p></div>`).join("");
  calcular();
}

function calcular({ piscar = false, arrastando = false } = {}) {
  const M = MODULOS[estado.aba], op = opcaoAtual(), campos = M.campos(op), chave = `${estado.aba}:${op}`, vals = valoresDe(chave, campos);
  const numeros = {}; let valido = true;
  for (const c of campos) {
    const input = $(`#campo-${c.id}`), r = lerNumero(input ? input.value : vals[c.id], { min: c.min, max: c.max, nome: c.rotulo.toLowerCase() });
    if (input) { input.setAttribute("aria-invalid", String(!r.ok)); $(`#erro-${c.id}`).textContent = r.ok ? "" : r.erro; }
    if (r.ok) { numeros[c.id] = r.valor; vals[c.id] = input ? input.value : vals[c.id]; } else valido = false;
  }
  const visor = $(".visor");
  if (!valido) {
    visor.classList.add("com-erro");
    pararContagem(); $("#visor-valor").textContent = "—"; $("#visor-valor").classList.remove("texto");
    $("#visor-nota").textContent = "Corrija o valor destacado para calcular.";
    $("#passos").innerHTML = "<li>Digite um número válido no campo destacado.</li>";
    $("#dados").innerHTML = ""; $("#tabela").innerHTML = "";
    return;
  }
  const R = M.calcular(op, numeros);
  const anterior = ultimo, mesmaAba = ultimaAba === estado.aba;
  // arrastando, a escala fica parada (senão a janela segue o ponto e ele foge do mouse)
  if (arrastando && anterior?.grafico && R.grafico) R.grafico = { ...R.grafico, range: anterior.grafico.range };
  ultimo = R; ultimaAba = estado.aba;
  visor.classList.toggle("com-erro", Boolean(R.erro));
  trocarTexto($("#visor-expressao"), R.expressao);
  mostrarValor(R, anterior, arrastando);
  trocarTexto($("#visor-nota"), R.erro ?? R.nota);
  // passos e tabela entram em cascata quando o assunto muda (aba, opção ou "Calcular")
  const novoAssunto = !arrastando && (!mesmaAba || anterior?.nota !== R.nota || piscar);
  $("#passos").innerHTML = (R.passos ?? [R.erro]).map((p, i) => `<li style="--i:${i}">${p}</li>`).join("");
  $("#dados").innerHTML = (R.dados ?? []).map(([k, val, mat], i) => `<dt style="--i:${i}">${k}</dt><dd style="--i:${i}" class="${mat ? "mat" : ""}">${val}</dd>`).join("");
  $("#tabela").innerHTML = R.tabela ? `<table><caption>${R.tabela.titulo}</caption><thead><tr>${R.tabela.cols.map((c) => `<th scope="col">${c}</th>`).join("")}</tr></thead>
    <tbody>${R.tabela.linhas.map((l, i) => `<tr style="--i:${i}" class="${i === R.tabela.atual ? "atual" : ""}">${l.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table>` : "";
  const det = $(".detalhes");
  det.classList.remove("entrando");
  if (novoAssunto && animacoesLigadas()) { void det.offsetWidth; det.classList.add("entrando"); }
  $("#legenda-grafico").innerHTML = (R.legenda ?? []).map(([k, t]) => `<span><i style="background:${COR_LEGENDA[k]}"></i>${t}</span>`).join("");
  animarGrafico(anterior, !mesmaAba ? "revelar" : piscar ? "cena" : arrastando ? "arrastar" : "transformar");
  if (piscar && animacoesLigadas()) {
    visor.animate([{ boxShadow: "0 0 0 0 rgba(255,143,182,.6)" }, { boxShadow: "0 0 0 16px rgba(255,143,182,0)" }], { duration: 700, easing: "cubic-bezier(.16,1,.3,1)" });
  }
}

// ───────── visor: o número "roda" até o novo resultado (como um marcador)
let contagem = 0;
function pararContagem() { cancelAnimationFrame(contagem); }
function mostrarValor(R, anterior, arrastando = false) {
  const out = $("#visor-valor");
  pararContagem();
  out.classList.toggle("texto", Boolean(R.erro || R.texto));
  const final = R.erro ? "indefinido" : R.valor;
  const de = anterior && Number.isFinite(anterior.numero) ? anterior.numero : 0;
  if (arrastando || !animacoesLigadas() || !Number.isFinite(R.numero) || R.erro || de === R.numero) {
    if (Number.isFinite(R.numero) && !R.erro) out.textContent = final; else trocarTexto(out, final);
    return;
  }
  const casas = Math.abs(R.numero) < 10 ? 4 : 2, t0 = performance.now(), dur = 1100;
  const passo = (agora) => {
    const k = Math.min(1, (agora - t0) / dur), e = 1 - (1 - k) ** 3;
    out.textContent = k < 1 ? fmt(de + (R.numero - de) * e, casas) : final;
    if (k < 1) contagem = requestAnimationFrame(passo);
  };
  contagem = requestAnimationFrame(passo);
}
/** Troca um texto com um deslize curto (entra de baixo, desfocado → nítido). */
function trocarTexto(el, texto) {
  if (el.textContent === texto) return;
  el.textContent = texto;
  if (animacoesLigadas()) el.animate([{ opacity: 0, transform: "translateY(8px)", filter: "blur(3px)" }, { opacity: 1, transform: "none", filter: "blur(0)" }], { duration: 560, easing: "cubic-bezier(.22,1,.36,1)" });
}

// ───────── gráfico animado
// "revelar":    a curva se escreve, depois vem a cena didática do módulo e o ponto pulsa.
// "transformar": a curva antiga escorrega até a nova e a escala dos eixos acompanha.
// "arrastar":   igual a transformar, mas curtinho (segue o mouse).
// "cena":       só repete a cena didática (botão Calcular).
// Cenas: limites → pontos correm até o buraco; derivadas → secante vira tangente (h → 0);
//        integrais → retângulos de Riemann (2 → 64) viram a área exata.
let quadroGrafico = 0, graficoAtual = null, mira = null;
const lerp = (a, b, k) => a + (b - a) * k;
const misturarRange = (a, b, k) => ({ xMin: lerp(a.xMin, b.xMin, k), xMax: lerp(a.xMax, b.xMax, k), yMin: lerp(a.yMin, b.yMin, k), yMax: lerp(a.yMax, b.yMax, k) });
const backOut = (x) => { const c = 1.7, t = Math.min(1, x) - 1; return 1 + (c + 1) * t ** 3 + c * t ** 2; };
const suave = (x) => { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x); };
const CENA = 3400;

/** Parâmetros de desenho e texto do visor para a cena no progresso c (0..1). */
function quadroCena(cena, c) {
  if (!cena) return { g: {} };
  if (cena.tipo === "aproximar") {
    const e = 1 - (1 - suave(c)) ** 2, d = cena.de * (1 - e) + 0.004;
    const xl = cena.alvo - d, xr = cena.alvo + d;
    return { g: { aproximar: [{ x: xl, y: cena.f(xl), lado: "esquerda" }, { x: xr, y: cena.f(xr), lado: "direita" }] }, nota: `x → ${fmt(cena.alvo)}: pela esquerda ${fmt(cena.f(xl), 3)}, pela direita ${fmt(cena.f(xr), 3)}` };
  }
  if (cena.tipo === "infinito") {
    const x = lerp(cena.de, cena.ate, suave(c));
    return { g: { aproximar: [{ x, y: cena.f(x), lado: "direita" }] }, nota: `x = ${fmt(x, 1)}: f(x) = ${fmt(cena.f(x), 3)} → 3` };
  }
  if (cena.tipo === "secante") {
    const e = suave(c / 0.85), h = 2.6 * (1 - e) ** 1.6 + 0.002, fim = Math.max(0, (c - 0.85) / 0.15);
    const m = (cena.f(cena.x0 + h) - cena.f(cena.x0)) / h;
    return { g: { secante: { x0: cena.x0, x1: cena.x0 + h, alfa: 1 - fim }, extras: fim }, nota: `inclinação da secante (h = ${fmt(h, 3)}) = ${fmt(m, 4)} → f′(x₀) = ${fmt(cena.inclinacao, 4)}` };
  }
  if (cena.tipo === "riemann") {
    const NS = [2, 4, 8, 16, 32, 64], k = Math.min(NS.length - 1, Math.floor((c / 0.86) * NS.length)), n = NS[k];
    const dx = (cena.b - cena.a) / n; let soma = 0;
    for (let i = 0; i < n; i += 1) { const y = cena.f(cena.a + (i + 0.5) * dx); if (Number.isFinite(y)) soma += y * dx; }
    const fim = Math.max(0, (c - 0.86) / 0.14);
    return { g: { riemann: { a: cena.a, b: cena.b, n, alfa: 1 - fim }, extras: fim }, nota: `Soma com ${n} retângulos ≈ ${fmt(soma, 4)} (exato: ${fmt(cena.exato, 4)})` };
  }
  return { g: {} };
}

function animarGrafico(anterior, modo) {
  cancelAnimationFrame(quadroGrafico);
  const R = ultimo, novo = R?.grafico, nota = $("#visor-nota");
  const velho = modo === "transformar" || modo === "arrastar" || modo === "cena" ? (graficoAtual ?? anterior?.grafico) : null;
  if (!novo) { graficoAtual = null; const c = $("#grafico"); c.getContext("2d").clearRect(0, 0, c.width, c.height); return; }
  if (!animacoesLigadas()) { graficoAtual = novo; desenhar(); return; }
  const comCena = (modo === "revelar" || modo === "cena") && R.cena;
  const durBase = modo === "revelar" ? 1500 : modo === "arrastar" ? 130 : 900;
  const durCena = comCena ? CENA : 0, total = durBase + durCena + 750;
  const t0 = performance.now();
  const quadro = (agora) => {
    const t = agora - t0, k = durBase ? Math.min(1, t / durBase) : 1, e = 1 - (1 - k) ** 3;
    let g;
    if (velho) {
      const fa = velho.f, fb = novo.f;
      g = {
        ...novo,
        range: misturarRange(velho.range, novo.range, e),
        f: (x) => { const a = fa(x), b = fb(x); return Number.isFinite(a) && Number.isFinite(b) ? lerp(a, b, e) : (e < 0.5 ? a : b); },
        tangent: novo.tangent && velho.tangent ? (x) => lerp(velho.tangent(x), novo.tangent(x), e) : novo.tangent,
        area: novo.area && velho.area ? { a: lerp(velho.area.a, novo.area.a, e), b: lerp(velho.area.b, novo.area.b, e) } : novo.area,
        points: (novo.points ?? []).map((p, i) => { const q = velho.points?.[i]; return q ? { x: lerp(q.x, p.x, e), y: lerp(q.y, p.y, e) } : p; }),
        holes: (novo.holes ?? []).map((p, i) => { const q = velho.holes?.[i]; return q ? { x: lerp(q.x, p.x, e), y: lerp(q.y, p.y, e) } : p; }),
        extras: (novo.tangent && !velho.tangent) || (novo.area && !velho.area) ? e : 1,
      };
    } else if (modo === "revelar") {
      g = { ...novo, revelar: e, extras: comCena ? 0 : Math.max(0, (k - 0.35) / 0.65), ponto: k < 0.62 ? 0 : backOut((k - 0.62) / 0.38) };
    } else g = { ...novo };
    // cena didática depois que a curva já está desenhada
    if (comCena && t >= durBase) {
      const c = Math.min(1, (t - durBase) / durCena), q = quadroCena(R.cena, c);
      Object.assign(g, q.g);
      if (q.nota && R === ultimo) nota.textContent = c < 1 ? q.nota : R.nota;
    }
    if (t > durBase + durCena) g.pulso = Math.min(1, (t - durBase - durCena) / 750);
    graficoAtual = { ...novo };
    desenharQuadro(g);
    if (t < total) quadroGrafico = requestAnimationFrame(quadro);
    else { quadroGrafico = 0; if (R === ultimo) nota.textContent = R.erro ?? R.nota; }
  };
  graficoAtual = null;
  quadroGrafico = requestAnimationFrame(quadro);
}

function desenharQuadro(g) {
  drawGraph($("#grafico"), { ...g, mira, alcas: Boolean(ultimo?.arrastar), cores: cores(), fonte: getComputedStyle(document.body).fontFamily });
}
function desenhar() {
  const canvas = $("#grafico");
  if (!ultimo?.grafico) { canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height); return; }
  desenharQuadro({ ...ultimo.grafico });
}

// ───────── abas: a pílula escura desliza até a aba escolhida
function moverIndicador(instantaneo = false) {
  const nav = $(".abas"), ind = $(".abas-indicador"), sel = nav.querySelector('[aria-selected="true"]');
  if (!ind || !sel) return;
  if (instantaneo) ind.style.transition = "none";
  ind.style.width = `${sel.offsetWidth}px`;
  ind.style.height = `${sel.offsetHeight}px`;
  ind.style.transform = `translate(${sel.offsetLeft}px, ${sel.offsetTop}px)`;
  if (instantaneo) { void ind.offsetWidth; ind.style.transition = ""; }
}

function trocarAba(aba, { foco = false } = {}) {
  if (aba === estado.aba && !foco) return;
  estado.aba = aba;
  document.querySelectorAll("[role=tab]").forEach((t) => {
    const sel = t.dataset.aba === aba;
    t.setAttribute("aria-selected", String(sel)); t.tabIndex = sel ? 0 : -1;
    if (sel && foco) t.focus();
  });
  moverIndicador();
  $("#painel").setAttribute("aria-labelledby", `aba-${aba}`);
  montarAba();
  orquestra.play(pecas);
}

// ───────── eventos
document.querySelectorAll("[role=tab]").forEach((t) => t.addEventListener("click", () => trocarAba(t.dataset.aba)));
$(".abas").addEventListener("keydown", (e) => {
  const abas = [...document.querySelectorAll("[role=tab]")], i = abas.findIndex((t) => t.dataset.aba === estado.aba);
  const d = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
  if (d) { e.preventDefault(); trocarAba(abas[(i + d + abas.length) % abas.length].dataset.aba, { foco: true }); }
});
document.addEventListener("keydown", (e) => {
  if (e.target.closest("input") || e.altKey || e.ctrlKey || e.metaKey) return;
  const n = ["1", "2", "3", "4"].indexOf(e.key);
  if (n >= 0) trocarAba(Object.keys(MODULOS)[n], { foco: true });
});
$("#lista-opcoes").addEventListener("click", (e) => {
  const b = e.target.closest("[data-opcao]"); if (!b) return;
  estado.opcao[estado.aba] = b.dataset.opcao; montarAba();
  $(`[data-opcao="${b.dataset.opcao}"]`).focus();
});
$("#lista-opcoes").addEventListener("keydown", (e) => {
  const d = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key]; if (!d) return;
  e.preventDefault();
  const ops = MODULOS[estado.aba].opcoes, i = ops.findIndex((o) => o.id === opcaoAtual()), nova = ops[(i + d + ops.length) % ops.length].id;
  estado.opcao[estado.aba] = nova; montarAba(); $(`[data-opcao="${nova}"]`).focus();
});
$("#form-valores").addEventListener("submit", (e) => { e.preventDefault(); calcular({ piscar: true }); });
$("#campos").addEventListener("input", () => calcular());
let pendente = 0;
addEventListener("resize", () => { cancelAnimationFrame(pendente); pendente = requestAnimationFrame(desenhar); });

// ───────── gráfico interativo: mira com (x; f(x)) sob o mouse e arrastar o ponto, o buraco ou as bordas a e b
const tela = $("#grafico");
let arrasto = null;
const xDoMouse = (e) => { const m = tela.__mapa, r = tela.getBoundingClientRect(); return m ? m.xDe(e.clientX - r.left) : null; };
const pxDe = (x) => tela.__mapa?.X(x);
function alvoPerto(e) {
  const A = ultimo?.arrastar, G = ultimo?.grafico;
  if (!A || !G || !tela.__mapa) return null;
  const r = tela.getBoundingClientRect(), mx = e.clientX - r.left;
  if (A.alvo === "bordas") {
    const da = Math.abs(pxDe(G.area.a) - mx), db = Math.abs(pxDe(G.area.b) - mx);
    const campo = da <= db ? "a" : "b";
    // a ordem dos campos pode estar invertida (a > b): arrasta o campo cujo valor está nessa borda
    const valA = Number($("#campo-a")?.value.replace(",", ".")), borda = campo === "a" ? G.area.a : G.area.b;
    return { campo: Math.abs(valA - borda) < 1e-9 ? "a" : "b", dist: Math.min(da, db) };
  }
  const xAlvo = A.alvo === "buraco" ? G.holes[0].x : G.points[0].x;
  return { campo: A.campos[0], dist: Math.abs(pxDe(xAlvo) - mx) };
}
function aplicarArrasto(e) {
  const x = xDoMouse(e); if (x == null) return;
  const M = MODULOS[estado.aba], campo = M.campos(opcaoAtual()).find((c) => c.id === arrasto.campo);
  const G = ultimo.grafico, passo = (G.range.xMax - G.range.xMin) > 30 ? 0.5 : 0.05;
  const xr = Math.max(G.range.xMin, Math.min(G.range.xMax, x));
  const v = Math.max(campo.min, Math.min(campo.max, Math.round(xr / passo) * passo));
  const input = $(`#campo-${campo.id}`);
  const texto = fmt(v, 2).replace("−", "-").replace(/\./g, "");
  if (input.value === texto) return;
  input.value = texto;
  calcular({ arrastando: true });
}
tela.addEventListener("pointerdown", (e) => {
  const alvo = alvoPerto(e);
  if (!alvo || alvo.dist > 36) return;
  arrasto = alvo; tela.setPointerCapture(e.pointerId); tela.classList.add("arrastando");
  aplicarArrasto(e);
});
tela.addEventListener("pointermove", (e) => {
  if (arrasto) { aplicarArrasto(e); return; }
  const alvo = alvoPerto(e);
  tela.style.cursor = alvo && alvo.dist <= 36 ? "grab" : "crosshair";
  mira = { x: xDoMouse(e) };
  if (!quadroGrafico) desenhar();
});
const soltar = () => {
  if (!arrasto) return;
  arrasto = null; tela.classList.remove("arrastando");
  // ao soltar, os passos e a tabela entram de novo em cascata e o ponto pulsa
  ultimaAba = estado.aba; calcular({ piscar: true });
};
tela.addEventListener("pointerup", soltar);
tela.addEventListener("pointercancel", soltar);
tela.addEventListener("pointerleave", () => { if (arrasto) return; mira = null; if (!quadroGrafico) desenhar(); });

const botaoAnim = $("#botao-animacoes");
function aplicarAnimacoes(ligadas) {
  document.documentElement.dataset.animacoes = ligadas ? "on" : "off";
  botaoAnim.setAttribute("aria-pressed", String(ligadas));
}
aplicarAnimacoes(animacoesLigadas());
botaoAnim.addEventListener("click", () => {
  const ligar = botaoAnim.getAttribute("aria-pressed") !== "true";
  definirAnimacoes(ligar); aplicarAnimacoes(ligar);
  if (ligar) { ultimaAba = null; calcular(); requestAnimationFrame(() => orquestra.play(pecas)); } else orquestra.terminar();
});

montarAba();
requestAnimationFrame(() => { moverIndicador(true); orquestra.play(pecas); });
addEventListener("resize", () => moverIndicador(true));

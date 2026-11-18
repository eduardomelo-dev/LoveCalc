// Cursores (setas comuns desenhadas com Three.js, cópia local em /vendor) que montam os blocos da aba.
// O movimento é calculado a cada quadro (requestAnimationFrame) por arcos de Bézier
// com suavização e um "clique" que afunda o cursor de leve.
// Nunca bloqueia: a camada não recebe cliques e qualquer tecla/clique termina a montagem.
import * as THREE from "../vendor/three.module.min.js";
import { canPlayCursorOrchestra, planRoutes, bezier, arcControls, travelTime, easeInOutCubic } from "./cursor-path.js";

const PEGAR = 0.35, SOLTAR = 0.35, PAUSA = 0.3;

// Preferência explícita da pessoa (botão "Animações"). Padrão: ligado, mesmo com os
// efeitos de animação do sistema desligados, porque as animações fazem parte da apresentação.
const CHAVE = "doce-amor:animacoes";
export function animacoesLigadas() {
  try { return localStorage.getItem(CHAVE) !== "off"; } catch { return true; }
}
export function definirAnimacoes(ligado) {
  try { localStorage.setItem(CHAVE, ligado ? "on" : "off"); } catch { /* sem armazenamento: vale só nesta aba */ }
}

export function cursorsAllowed() {
  return canPlayCursorOrchestra({
    reducedMotion: !animacoesLigadas(),
    finePointer: matchMedia("(pointer: fine)").matches,
    compactViewport: matchMedia("(max-width: 900px)").matches,
  });
}

// ───────── seta comum de sistema (branca, borda preta, ponta na origem)
const SETA = [[0, 0], [0, -17], [4, -13], [7, -20], [10, -19], [7, -12], [12, -12]];
function setaForma() {
  const s = new THREE.Shape();
  s.moveTo(...SETA[0]); SETA.slice(1).forEach((p) => s.lineTo(...p)); s.closePath();
  return s;
}

// bloco preso na seta: segue o deslocamento sem transição e fica por cima dos outros
function arrastarPeca(peca, dx, dy, opacidade) {
  peca.classList.remove("peca-pendente");
  Object.assign(peca.style, { transition: "none", zIndex: "40", transform: `translate(${dx}px, ${dy}px)`, opacity: String(opacidade) });
}
function soltarPeca(peca) {
  peca.classList.remove("peca-pendente");
  if (!peca.style.transform && !peca.style.opacity) return;
  Object.assign(peca.style, { transition: "", zIndex: "", transform: "", opacity: "" });
}

export class CursorOrchestra {
  constructor() {
    this.ativo = null;
    this.canvas = null;
  }

  #montarCena() {
    if (this.renderer) return true;
    try {
      this.canvas = document.createElement("canvas");
      this.canvas.className = "cursor-layer";
      this.canvas.setAttribute("aria-hidden", "true");
      document.body.append(this.canvas);
      this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, alpha: true, antialias: true });
    } catch {
      this.canvas?.remove(); this.canvas = null; return false;
    }
    this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    this.cena = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(0, 1, 0, -1, -500, 500);
    const geo = new THREE.ShapeGeometry(setaForma());
    const borda = new THREE.BufferGeometry().setFromPoints([...SETA, SETA[0]].map(([x, y]) => new THREE.Vector3(x, y, 1)));
    const corpoMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const bordaMat = new THREE.LineBasicMaterial({ color: 0x000000 });
    this.cursores = [1, 2, 3, 4].map(() => {
      const seta = new THREE.Group();
      seta.add(new THREE.Mesh(geo, corpoMat), new THREE.Line(borda, bordaMat));
      seta.visible = false;
      this.cena.add(seta);
      return { seta };
    });
    return true;
  }

  #ajustarTamanho() {
    const W = innerWidth, H = innerHeight;
    this.renderer.setSize(W, H, false);
    Object.assign(this.camera, { left: 0, right: W, top: 0, bottom: -H });
    this.camera.updateProjectionMatrix();
  }

  /** Monta os blocos: cada cursor busca um bloco na lateral da tela e o arrasta até o lugar.
   *  Sem WebGL ou sem permissão: só um surgimento curto. */
  play(pecas) {
    this.terminar();
    if (!pecas.length) return;
    pecas.forEach((p) => p.classList.add("peca-pendente"));
    if (!cursorsAllowed() || !this.#montarCena()) {
      pecas.forEach((p, i) => this.#revelar(p, null, i * 110));
      return;
    }
    this.#ajustarTamanho();
    const W = innerWidth;
    // para cada bloco: de que lado vem, onde a seta segura (ponto da borda que entra primeiro)
    // e onde a pega começa (perto da borda da tela, com o bloco quase todo de fora)
    const pegas = pecas.map((p, i) => {
      const r = p.getBoundingClientRect(), cx = r.left + r.width / 2;
      const esquerda = cx < W * 0.45 ? true : cx > W * 0.55 ? false : i % 2 === 0;
      const y = r.top + Math.min(r.height * 0.3, 60);
      const segura = { x: esquerda ? r.right - 34 : r.left + 34, y };
      const comeco = { x: esquerda ? 60 : W - 60, y };
      return { esquerda, segura, comeco, chegada: { x: esquerda ? -40 : W + 40, y: y + 90 } };
    });

    const roteiros = planRoutes(pecas.length, this.cursores.length).map((rota, c) => {
      const passos = []; let t = c * 0.55, de = pegas[rota[0]].chegada;
      rota.forEach((i) => {
        const { comeco, segura, esquerda } = pegas[i];
        const dur = travelTime(de, comeco), [c1, c2] = arcControls(de, comeco, esquerda ? 1 : -1, 0.2);
        passos.push({ tipo: "voo", t0: t, t1: t + dur, de, c1, c2, para: comeco });
        t += dur;
        passos.push({ tipo: "pegar", t0: t, t1: t + PEGAR, em: comeco, peca: i, segura });
        t += PEGAR;
        const arr = Math.min(2, Math.max(1.2, Math.abs(segura.x - comeco.x) / 550));
        const [a1, a2] = arcControls(comeco, segura, esquerda ? -1 : 1, 0.04);
        passos.push({ tipo: "arrastar", t0: t, t1: t + arr, de: comeco, c1: a1, c2: a2, para: segura, peca: i, segura });
        t += arr;
        passos.push({ tipo: "soltar", t0: t, t1: t + SOLTAR, em: segura, peca: i });
        t += SOLTAR + PAUSA; de = segura;
      });
      const ultima = pegas[rota.at(-1)], fim = { x: ultima.esquerda ? -60 : W + 60, y: ultima.segura.y + 160 };
      const dur = travelTime(de, fim), [c1, c2] = arcControls(de, fim, ultima.esquerda ? -1 : 1, 0.18);
      passos.push({ tipo: "voo", t0: t, t1: t + dur, de, c1, c2, para: fim, saida: true });
      return passos;
    });
    const total = Math.max(...roteiros.map((r) => r.at(-1).t1));
    this.canvas.classList.add("ativa");
    document.documentElement.classList.add("montando");

    const inicio = performance.now();
    const pular = () => this.terminar();
    addEventListener("pointerdown", pular, { once: true, capture: true });
    addEventListener("keydown", pular, { once: true, capture: true });
    addEventListener("wheel", pular, { once: true, passive: true });
    addEventListener("resize", pular, { once: true });
    this.ativo = { pecas, quadro: 0, pular };

    const quadro = (agora) => {
      if (!this.ativo) return;
      const t = (agora - inicio) / 1000;
      roteiros.forEach((r, c) => this.#posar(this.cursores[c], r, t, pecas));
      this.renderer.render(this.cena, this.camera);
      if (t < total + 0.3) this.ativo.quadro = requestAnimationFrame(quadro);
      else this.terminar();
    };
    this.ativo.quadro = requestAnimationFrame(quadro);
  }

  #posar(cu, roteiro, t, pecas) {
    const passo = roteiro.find((p) => t < p.t1) ?? roteiro.at(-1);
    if (t < roteiro[0].t0) { cu.seta.visible = false; return; }
    cu.seta.visible = true;
    const k = Math.min(1, Math.max(0, (t - passo.t0) / (passo.t1 - passo.t0)));
    let pos, pressao = 0;
    if (passo.tipo === "voo") {
      pos = bezier(passo.de, passo.c1, passo.c2, passo.para, easeInOutCubic(k));
      if (passo.saida && k >= 1) cu.seta.visible = false;
    } else if (passo.tipo === "pegar") {
      pos = passo.em; pressao = easeInOutCubic(k);
      // o bloco espia na borda, com a ponta presa na seta
      arrastarPeca(pecas[passo.peca], pos.x - passo.segura.x, pos.y - passo.segura.y, 0.25 * k);
    } else if (passo.tipo === "arrastar") {
      const e = easeInOutCubic(k);
      pos = bezier(passo.de, passo.c1, passo.c2, passo.para, e); pressao = 1;
      arrastarPeca(pecas[passo.peca], pos.x - passo.segura.x, pos.y - passo.segura.y, 0.25 + 0.75 * e);
    } else {
      pos = passo.em; pressao = 1 - easeInOutCubic(k);
      soltarPeca(pecas[passo.peca]);
    }
    cu.seta.position.set(pos.x, -pos.y, 0);
    cu.seta.scale.setScalar(1 - pressao * 0.12); // segurando: afunda de leve
  }

  #revelar(peca, ponto, atraso) {
    const r = peca.getBoundingClientRect();
    const origem = ponto ? `${ponto.x - r.left}px ${ponto.y - r.top}px` : "50% 0%";
    peca.style.transformOrigin = origem;
    peca.classList.remove("peca-pendente");
    peca.animate(
      [
        { opacity: 0, transform: "translateY(10px) scale(.98)", filter: "blur(4px)" },
        { opacity: 1, offset: 0.55, filter: "blur(0)" },
        { opacity: 1, transform: "none", filter: "blur(0)" },
      ],
      { duration: 1000, delay: atraso, easing: "cubic-bezier(.22,1,.36,1)", fill: "backwards" },
    );
  }

  /** Termina na hora: revela o que faltar e some com os cursores. */
  terminar() {
    const a = this.ativo; this.ativo = null;
    if (!a) return;
    cancelAnimationFrame(a.quadro);
    removeEventListener("pointerdown", a.pular, { capture: true });
    removeEventListener("keydown", a.pular, { capture: true });
    removeEventListener("wheel", a.pular);
    removeEventListener("resize", a.pular);
    a.pecas.forEach(soltarPeca);
    document.documentElement.classList.remove("montando");
    this.cursores?.forEach((c) => { c.seta.visible = false; });
    this.canvas?.classList.remove("ativa");
    this.renderer?.clear();
  }
}

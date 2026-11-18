// Plano cartesiano em canvas, sem bibliotecas. Desenha uma função qualquer, com
// extras opcionais: reta tangente, área entre a e b, pontos marcados e buracos.

/** Amostra f no intervalo; pontos não finitos viram null (quebra a linha). */
export function sample(f, xMin, xMax, steps = 240) {
  return Array.from({ length: steps + 1 }, (_, i) => {
    const x = xMin + ((xMax - xMin) * i) / steps;
    const y = f(x);
    return Number.isFinite(y) ? { x, y } : null;
  });
}

/** Intervalo de y que cabe a curva, com folga, e ignora valores absurdos. */
export function autoRange(f, xMin, xMax, extras = []) {
  const ys = sample(f, xMin, xMax, 160).filter(Boolean).map((p) => p.y).concat(extras).filter((y) => Math.abs(y) < 1e6);
  let yMin = Math.min(...ys), yMax = Math.max(...ys);
  if (yMin === yMax) { yMin -= 5; yMax += 5; }
  const pad = (yMax - yMin) * 0.12;
  return { xMin, xMax, yMin: yMin - pad, yMax: yMax + pad };
}

/** Passo "bonito" (1, 2, 5 × 10ⁿ) para a grade. */
export function niceStep(span, alvo = 8) {
  const bruto = span / alvo, p = 10 ** Math.floor(Math.log10(bruto)), m = bruto / p;
  return (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * p;
}

/**
 * Desenha o quadro do gráfico. Parâmetros de animação (todos 0..1, padrão 1):
 *   revelar   — fração da largura já desenhada (a curva "se escreve" da esquerda para a direita)
 *   extras    — opacidade da tangente, da área e dos buracos
 *   ponto     — escala do ponto marcado (entra com um pequeno salto)
 *   pulso     — anel que se expande em volta do ponto (0 = sem anel)
 * Cenas didáticas (opcionais):
 *   secante   — { x0, x1, alfa }: reta secante que gira até a tangente quando x1 → x0
 *   aproximar — [{ x, y, lado }]: pontos que correm pela curva até o limite, com o valor ao lado
 *   riemann   — { a, b, n, alfa }: retângulos (ponto médio) que aproximam a área
 *   mira      — { x }: linha e etiqueta (x; f(x)) sob o mouse
 *   alcas     — mostra as alças arrastáveis (ponto e bordas da área)
 */
export function drawGraph(canvas, { f, range, tangent, area, points = [], holes = [], cores, fonte = "system-ui", revelar = 1, extras = 1, ponto = 1, pulso = 0, secante, aproximar, riemann, mira, alcas = false }) {
  const ctx = canvas.getContext("2d");
  const ratio = window.devicePixelRatio || 1;
  const W = canvas.clientWidth, H = canvas.clientHeight;
  if (!W || !H) return;
  const cw = Math.round(W * ratio), ch = Math.round(H * ratio);
  if (canvas.width !== cw || canvas.height !== ch) { canvas.width = cw; canvas.height = ch; }
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  const pad = { t: 18, r: 18, b: 34, l: 52 };
  const w = W - pad.l - pad.r, h = H - pad.t - pad.b;
  const { xMin, xMax, yMin, yMax } = range;
  const X = (x) => pad.l + ((x - xMin) / (xMax - xMin)) * w;
  const Y = (y) => pad.t + h - ((y - yMin) / (yMax - yMin)) * h;
  const base = Y(Math.max(yMin, Math.min(0, yMax)));
  // o app usa este mapa para converter o mouse em x (arrastar e mira)
  canvas.__mapa = { xDe: (px) => xMin + ((px - pad.l) / w) * (xMax - xMin), X, Y, pad, w, h };
  ctx.clearRect(0, 0, W, H);

  // grade e rótulos
  const sx = niceStep(xMax - xMin), sy = niceStep(yMax - yMin, 6);
  ctx.lineWidth = 1; ctx.strokeStyle = cores.grade;
  ctx.font = `500 12px ${fonte}`; ctx.fillStyle = cores.rotulo;
  ctx.textAlign = "center"; ctx.textBaseline = "top";
  for (let x = Math.ceil(xMin / sx) * sx; x <= xMax + 1e-9; x += sx) {
    ctx.beginPath(); ctx.moveTo(X(x), pad.t); ctx.lineTo(X(x), pad.t + h); ctx.stroke();
    ctx.fillText(fmt(x), X(x), pad.t + h + 8);
  }
  ctx.textAlign = "right"; ctx.textBaseline = "middle";
  for (let y = Math.ceil(yMin / sy) * sy; y <= yMax + 1e-9; y += sy) {
    ctx.beginPath(); ctx.moveTo(pad.l, Y(y)); ctx.lineTo(pad.l + w, Y(y)); ctx.stroke();
    ctx.fillText(fmt(y), pad.l - 8, Y(y));
  }

  // eixos
  ctx.strokeStyle = cores.eixo; ctx.lineWidth = 1.5; ctx.beginPath();
  if (yMin <= 0 && yMax >= 0) { ctx.moveTo(pad.l, Y(0)); ctx.lineTo(pad.l + w, Y(0)); }
  if (xMin <= 0 && xMax >= 0) { ctx.moveTo(X(0), pad.t); ctx.lineTo(X(0), pad.t + h); }
  ctx.stroke();

  // tudo o que é "conteúdo" fica recortado na área do gráfico e na fração já revelada
  ctx.save(); ctx.beginPath(); ctx.rect(pad.l, pad.t - 4, w * revelar, h + 8); ctx.clip();

  // área (integral definida): degradê da curva até o eixo
  if (area && extras > 0) {
    const a = Math.max(area.a, xMin), b = Math.min(area.b, xMax);
    const pts = sample(f, a, b, 160).filter(Boolean);
    const g = ctx.createLinearGradient(0, pad.t, 0, pad.t + h);
    g.addColorStop(0, cores.areaForte); g.addColorStop(1, cores.area);
    ctx.globalAlpha = extras;
    ctx.beginPath(); ctx.moveTo(X(a), base);
    pts.forEach((p) => ctx.lineTo(X(p.x), Y(p.y)));
    ctx.lineTo(X(b), base); ctx.closePath();
    ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = cores.curva; ctx.lineWidth = 1; ctx.setLineDash([3, 4]);
    ctx.beginPath(); ctx.moveTo(X(a), base); ctx.lineTo(X(a), Y(f(a))); ctx.moveTo(X(b), base); ctx.lineTo(X(b), Y(f(b))); ctx.stroke();
    ctx.setLineDash([]); ctx.globalAlpha = 1;
  }

  if (riemann && riemann.alfa > 0) {
    const { a, b, n } = riemann, dx = (b - a) / n;
    ctx.globalAlpha = riemann.alfa;
    for (let i = 0; i < n; i += 1) {
      const xm = a + (i + 0.5) * dx, y = f(xm);
      if (!Number.isFinite(y)) continue;
      const x1 = X(a + i * dx), x2 = X(a + (i + 1) * dx), yy = Y(y);
      ctx.fillStyle = i % 2 ? cores.retangulo2 : cores.retangulo;
      ctx.fillRect(x1, Math.min(yy, base), x2 - x1, Math.abs(base - yy));
      if (n <= 32) { ctx.strokeStyle = cores.fundo; ctx.lineWidth = 1; ctx.strokeRect(x1, Math.min(yy, base), x2 - x1, Math.abs(base - yy)); }
    }
    ctx.globalAlpha = 1;
  }

  // curva (quebra em pontos inválidos e em saltos verticais), com um brilho suave por baixo
  const tracar = () => {
    ctx.beginPath(); let prev = null;
    for (const p of sample(f, xMin, xMax)) {
      if (!p) { prev = null; continue; }
      const salto = prev && Math.abs(Y(p.y) - Y(prev.y)) > h * 0.8;
      if (!prev || salto) ctx.moveTo(X(p.x), Y(p.y)); else ctx.lineTo(X(p.x), Y(p.y));
      prev = p;
    }
  };
  ctx.lineJoin = "round"; ctx.lineCap = "round";
  ctx.strokeStyle = cores.brilho; ctx.lineWidth = 10; tracar(); ctx.stroke();
  ctx.strokeStyle = cores.curva; ctx.lineWidth = 3.2; tracar(); ctx.stroke();

  if (tangent && extras > 0) {
    ctx.globalAlpha = extras;
    ctx.strokeStyle = cores.tangente; ctx.lineWidth = 2.2; ctx.setLineDash([8, 6]);
    ctx.beginPath(); ctx.moveTo(X(xMin), Y(tangent(xMin))); ctx.lineTo(X(xMax), Y(tangent(xMax))); ctx.stroke();
    ctx.setLineDash([]); ctx.globalAlpha = 1;
  }
  if (secante && secante.alfa > 0) {
    const { x0, x1 } = secante, y0 = f(x0), y1 = f(x1);
    if (Number.isFinite(y0) && Number.isFinite(y1) && x1 !== x0) {
      const m = (y1 - y0) / (x1 - x0), r = (x) => y0 + m * (x - x0);
      ctx.globalAlpha = secante.alfa;
      ctx.strokeStyle = cores.secante; ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.moveTo(X(xMin), Y(r(xMin))); ctx.lineTo(X(xMax), Y(r(xMax))); ctx.stroke();
      ctx.fillStyle = cores.secante;
      ctx.beginPath(); ctx.arc(X(x1), Y(y1), 5.5, 0, Math.PI * 2); ctx.fill();
      // "h" desenhado como uma cota entre x0 e x1
      const yb = Math.min(pad.t + h - 6, Math.max(Y(y0), Y(y1)) + 22);
      ctx.strokeStyle = cores.secante; ctx.lineWidth = 1.2; ctx.beginPath();
      ctx.moveTo(X(x0), yb - 5); ctx.lineTo(X(x0), yb + 5); ctx.moveTo(X(x1), yb - 5); ctx.lineTo(X(x1), yb + 5);
      ctx.moveTo(X(x0), yb); ctx.lineTo(X(x1), yb); ctx.stroke();
      ctx.font = `italic 600 13px ${fonte}`; ctx.textAlign = "center"; ctx.textBaseline = "top";
      ctx.fillText(`h = ${fmt3(x1 - x0)}`, (X(x0) + X(x1)) / 2, yb + 6);
      ctx.globalAlpha = 1;
    }
  }
  ctx.restore();

  for (const p of points) {
    const px = X(p.x), py = Y(p.y);
    if (pulso > 0 && pulso < 1) {
      ctx.beginPath(); ctx.arc(px, py, 7 + pulso * 22, 0, Math.PI * 2);
      ctx.strokeStyle = cores.curva; ctx.globalAlpha = (1 - pulso) * 0.7; ctx.lineWidth = 2; ctx.stroke(); ctx.globalAlpha = 1;
    }
    if (ponto <= 0) continue;
    ctx.beginPath(); ctx.arc(px, py, 7 * ponto, 0, Math.PI * 2);
    ctx.fillStyle = cores.ponto; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = cores.fundo; ctx.stroke();
  }
  ctx.globalAlpha = extras;
  for (const p of holes) {
    ctx.beginPath(); ctx.arc(X(p.x), Y(p.y), 6.5, 0, Math.PI * 2);
    ctx.fillStyle = cores.fundo; ctx.fill(); ctx.lineWidth = 2.6; ctx.strokeStyle = cores.curva; ctx.stroke();
  }
  ctx.globalAlpha = 1;

  for (const a of aproximar ?? []) {
    if (!Number.isFinite(a.y) || a.x < xMin || a.x > xMax) continue;
    const px = X(a.x), py = Y(a.y), cor = a.lado === "esquerda" ? cores.esquerda : cores.direita;
    ctx.beginPath(); ctx.arc(px, py, 7, 0, Math.PI * 2); ctx.fillStyle = cor; ctx.fill();
    ctx.lineWidth = 2.5; ctx.strokeStyle = cores.fundo; ctx.stroke();
    etiqueta(ctx, `${fmt3(a.y)}`, px + (a.lado === "esquerda" ? -12 : 12), py - 16, a.lado === "esquerda" ? "right" : "left", cor, fonte);
  }

  if (alcas && area) {
    for (const xb of [area.a, area.b]) {
      if (xb < xMin || xb > xMax) continue;
      const px = X(xb), py = base;
      ctx.fillStyle = cores.fundo; ctx.strokeStyle = cores.curva; ctx.lineWidth = 2;
      redondo(ctx, px - 7, py - 13, 14, 26, 6); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = cores.curva; ctx.lineWidth = 1.2; ctx.beginPath();
      ctx.moveTo(px - 2, py - 5); ctx.lineTo(px - 2, py + 5); ctx.moveTo(px + 2, py - 5); ctx.lineTo(px + 2, py + 5); ctx.stroke();
    }
  }

  if (mira && mira.x >= xMin && mira.x <= xMax) {
    const y = f(mira.x);
    if (Number.isFinite(y)) {
      const px = X(mira.x), py = Y(y);
      ctx.strokeStyle = cores.mira; ctx.lineWidth = 1; ctx.setLineDash([3, 4]);
      ctx.beginPath(); ctx.moveTo(px, pad.t); ctx.lineTo(px, pad.t + h); ctx.stroke(); ctx.setLineDash([]);
      ctx.beginPath(); ctx.arc(px, py, 4.5, 0, Math.PI * 2); ctx.fillStyle = cores.curva; ctx.fill();
      etiqueta(ctx, `(${fmt3(mira.x)}; ${fmt3(y)})`, px + (px > pad.l + w * 0.7 ? -12 : 12), py - 18, px > pad.l + w * 0.7 ? "right" : "left", cores.ponto, fonte);
    }
  }
}

function redondo(ctx, x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}

/** Plaquinha arredondada com texto (valores ao lado dos pontos). */
function etiqueta(ctx, texto, x, y, alinhar, cor, fonte) {
  ctx.font = `600 12.5px ${fonte}`;
  const tw = ctx.measureText(texto).width + 14, th = 22, x0 = alinhar === "right" ? x - tw : x;
  ctx.fillStyle = cor; redondo(ctx, x0, y - th / 2, tw, th, 7); ctx.fill();
  ctx.fillStyle = "#ffffff"; ctx.textAlign = "left"; ctx.textBaseline = "middle"; ctx.fillText(texto, x0 + 7, y + 0.5);
}

const fmt3 = (v) => new Intl.NumberFormat("pt-BR", { maximumFractionDigits: Math.abs(v) < 1 ? 3 : 2 }).format(Math.abs(v) < 1e-9 ? 0 : v).replace("-", "−");

const fmt = (v) => {
  const r = Math.abs(v) < 1e-9 ? 0 : v;
  return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 }).format(r).replace("-", "−");
};

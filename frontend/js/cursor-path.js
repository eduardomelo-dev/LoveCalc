// Trajetórias dos cursores: contas puras (sem DOM nem WebGL), testáveis no Node.

/** Só anima com mouse, tela grande e sem pedido de movimento reduzido. */
export function canPlayCursorOrchestra({ reducedMotion, finePointer, compactViewport = false }) {
  return !reducedMotion && finePointer && !compactViewport;
}

/** Distribui os blocos entre os cursores em rodízio: [[0,3],[1,4],[2]]. */
export function planRoutes(nPieces, nCursors = 3) {
  const rotas = Array.from({ length: Math.min(nCursors, nPieces) }, () => []);
  for (let i = 0; i < nPieces; i += 1) rotas[i % rotas.length].push(i);
  return rotas;
}

export const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
export const easeOutExpo = (t) => (t >= 1 ? 1 : 1 - 2 ** (-10 * t));

/** Curva de Bézier cúbica. */
export function bezier(p0, p1, p2, p3, t) {
  const u = 1 - t;
  return {
    x: u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x,
    y: u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y,
  };
}

/** Pontos de controle de um arco suave de a até b (curva para um lado, como a mão faz). */
export function arcControls(a, b, lado = 1, curvatura = 0.28) {
  const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy) || 1;
  const nx = (-dy / L) * L * curvatura * lado, ny = (dx / L) * L * curvatura * lado;
  return [{ x: a.x + dx * 0.25 + nx, y: a.y + dy * 0.25 + ny }, { x: a.x + dx * 0.75 + nx * 0.6, y: a.y + dy * 0.75 + ny * 0.6 }];
}

/** Tempo de viagem proporcional à distância, dentro de um limite confortável. */
export function travelTime(a, b) {
  return Math.min(1.4, Math.max(0.75, Math.hypot(b.x - a.x, b.y - a.y) / 700));
}

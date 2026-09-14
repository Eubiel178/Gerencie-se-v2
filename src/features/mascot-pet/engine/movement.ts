import { MascotVector2 } from "../domain/types";

export interface MascotBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

/** A partir dessa distância da borda da área permitida, considera "perto
 * o suficiente" pra trocar de direção (regra 6 do pedido). */
const EDGE_MARGIN = 14;

/** Abaixo dessa distância do alvo, considera que chegou (regra 7) -
 * evita ficar oscilando em torno do ponto exato por causa de arredondamento. */
export const ARRIVAL_THRESHOLD = 6;

export function distance(a: MascotVector2, b: MascotVector2): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function directionTo(from: MascotVector2, to: MascotVector2): MascotVector2 {
  const d = distance(from, to);
  if (d === 0) return { x: 0, y: 0 };
  return { x: (to.x - from.x) / d, y: (to.y - from.y) / d };
}

export function clampToBounds(position: MascotVector2, bounds: MascotBounds): MascotVector2 {
  return {
    x: Math.min(Math.max(position.x, bounds.minX), bounds.maxX),
    y: Math.min(Math.max(position.y, bounds.minY), bounds.maxY),
  };
}

// Sem viés nenhum, o alvo cai em qualquer ponto uniformemente - o que na
// prática faz o bicho passar boa parte do tempo repousando no meio da
// área (onde a maioria dos pontos aleatórios cai), nunca nos cantos
// (achado relatado: "os animais não deveriam parar no centro da tela e
// sim nos cantos"). A maior parte das vezes (não sempre, pra não ficar
// mecânico) mira perto de um dos 4 cantos da área em vez de um ponto
// qualquer - o bicho passa a migrar de canto em canto, com uma folga
// espalhada ao redor de cada canto pra não empilhar vários bichos no
// mesmo pixel quando há mais de um na mesma área (ex. vitrine da Landing
// Page, cada um na própria raia).
const CORNER_TARGET_CHANCE = 0.7;
const CORNER_INSET_RATIO = 0.12;
const CORNER_JITTER_RATIO = 0.18;

export function pickRandomTarget(bounds: MascotBounds): MascotVector2 {
  const width = Math.max(bounds.maxX - bounds.minX, 0);
  const height = Math.max(bounds.maxY - bounds.minY, 0);

  if (width > 0 && height > 0 && Math.random() < CORNER_TARGET_CHANCE) {
    return pickCornerTarget(bounds, width, height);
  }

  return {
    x: bounds.minX + Math.random() * width,
    y: bounds.minY + Math.random() * height,
  };
}

function pickCornerTarget(bounds: MascotBounds, width: number, height: number): MascotVector2 {
  const insetX = width * CORNER_INSET_RATIO;
  const insetY = height * CORNER_INSET_RATIO;
  const jitterX = width * CORNER_JITTER_RATIO;
  const jitterY = height * CORNER_JITTER_RATIO;

  const cornerX = Math.random() < 0.5 ? bounds.minX + insetX : bounds.maxX - insetX;
  const cornerY = Math.random() < 0.5 ? bounds.minY + insetY : bounds.maxY - insetY;

  return clampToBounds(
    {
      x: cornerX + (Math.random() - 0.5) * jitterX,
      y: cornerY + (Math.random() - 0.5) * jitterY,
    },
    bounds
  );
}

/** Move `position` em direção a `target` a `speed` px/s, independente de
 * frame rate (usa `deltaMS` do ticker) - nunca ultrapassa o alvo. */
export function stepToward(
  position: MascotVector2,
  target: MascotVector2,
  speed: number,
  deltaMS: number
): MascotVector2 {
  const remaining = distance(position, target);
  if (remaining === 0) return position;

  const maxStep = (speed * deltaMS) / 1000;
  if (remaining <= maxStep) return target;

  const dir = directionTo(position, target);
  return { x: position.x + dir.x * maxStep, y: position.y + dir.y * maxStep };
}

export function isNearEdge(position: MascotVector2, bounds: MascotBounds, margin = EDGE_MARGIN): boolean {
  return (
    position.x - bounds.minX < margin ||
    bounds.maxX - position.x < margin ||
    position.y - bounds.minY < margin ||
    bounds.maxY - position.y < margin
  );
}

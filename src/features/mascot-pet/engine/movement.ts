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

export function pickRandomTarget(bounds: MascotBounds): MascotVector2 {
  const width = Math.max(bounds.maxX - bounds.minX, 0);
  const height = Math.max(bounds.maxY - bounds.minY, 0);
  return {
    x: bounds.minX + Math.random() * width,
    y: bounds.minY + Math.random() * height,
  };
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

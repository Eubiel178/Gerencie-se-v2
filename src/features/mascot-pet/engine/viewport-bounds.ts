import { MascotBounds } from "./movement";

// Largura da sidebar fixa em desktop (ver `.sidebar` em
// src/app/home/home-layout.module.css) - o mascote nunca deve andar por
// cima da navegação. Em telas <= 720px a sidebar já some (mesmo
// breakpoint usado lá).
const SIDEBAR_WIDTH = 248;
const SIDEBAR_BREAKPOINT = 720;

const DESKTOP_MARGIN = 16;
// Mobile: margem maior em cima/embaixo pra não cobrir cabeçalho/gestos
// de borda e áreas de toque importantes.
const MOBILE_MARGIN_X = 12;
const MOBILE_MARGIN_TOP = 56;
const MOBILE_MARGIN_BOTTOM = 72;

export function isMobileViewport(): boolean {
  return window.innerWidth <= SIDEBAR_BREAKPOINT;
}

// Garante uma área de passeio mínima mesmo numa janela bem estreita -
// sem isso, uma janela pequena o bastante faria `minX === maxX` (a
// margem/sidebar "comendo" todo o espaço) e o bichinho pareceria
// travado, nunca andando de verdade.
const MIN_RANGE_PX = 80;

function widen(min: number, max: number, minRange: number): [number, number] {
  if (max - min >= minRange) return [min, max];
  return [Math.min(min, max - minRange), max];
}

/** Área segura de rolagem livre, recalculada a cada resize (barato - só
 * aritmética, sem tocar no DOM além de ler `window.inner*`). */
export function computeViewportBounds(spriteWidth: number, spriteHeight: number): MascotBounds {
  const mobile = isMobileViewport();

  if (mobile) {
    const [minX, maxX] = widen(
      MOBILE_MARGIN_X,
      Math.max(window.innerWidth - spriteWidth - MOBILE_MARGIN_X, MOBILE_MARGIN_X),
      MIN_RANGE_PX
    );
    const [minY, maxY] = widen(
      MOBILE_MARGIN_TOP,
      Math.max(window.innerHeight - spriteHeight - MOBILE_MARGIN_BOTTOM, MOBILE_MARGIN_TOP),
      MIN_RANGE_PX
    );
    return { minX, maxX, minY, maxY };
  }

  const [minX, maxX] = widen(
    SIDEBAR_WIDTH + DESKTOP_MARGIN,
    Math.max(window.innerWidth - spriteWidth - DESKTOP_MARGIN, SIDEBAR_WIDTH + DESKTOP_MARGIN),
    MIN_RANGE_PX
  );
  const [minY, maxY] = widen(
    DESKTOP_MARGIN,
    Math.max(window.innerHeight - spriteHeight - DESKTOP_MARGIN, DESKTOP_MARGIN),
    MIN_RANGE_PX
  );
  return { minX, maxX, minY, maxY };
}

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

/** Área segura de rolagem livre, recalculada a cada resize (barato - só
 * aritmética, sem tocar no DOM além de ler `window.inner*`). */
export function computeViewportBounds(spriteWidth: number, spriteHeight: number): MascotBounds {
  const mobile = isMobileViewport();

  if (mobile) {
    return {
      minX: MOBILE_MARGIN_X,
      maxX: Math.max(window.innerWidth - spriteWidth - MOBILE_MARGIN_X, MOBILE_MARGIN_X),
      minY: MOBILE_MARGIN_TOP,
      maxY: Math.max(window.innerHeight - spriteHeight - MOBILE_MARGIN_BOTTOM, MOBILE_MARGIN_TOP),
    };
  }

  return {
    minX: SIDEBAR_WIDTH + DESKTOP_MARGIN,
    maxX: Math.max(window.innerWidth - spriteWidth - DESKTOP_MARGIN, SIDEBAR_WIDTH + DESKTOP_MARGIN),
    minY: DESKTOP_MARGIN,
    maxY: Math.max(window.innerHeight - spriteHeight - DESKTOP_MARGIN, DESKTOP_MARGIN),
  };
}

"use client";

import dynamic from "next/dynamic";

/**
 * Carrega o PixiJS (e o motor do mascote) só no cliente, em um chunk
 * separado do bundle da Landing Page - mesma razão de
 * `mascot-pet/components/mascot-pet/lazy.tsx`: a Landing é a primeira
 * página que qualquer visitante carrega, então o peso do PixiJS nunca
 * deve entrar no JS inicial dela. `ssr: false` é necessário: o motor
 * manipula `<canvas>` diretamente via DOM.
 */
export const MascotSwarm = dynamic(() => import("./index").then((mod) => mod.MascotSwarm), {
  ssr: false,
});

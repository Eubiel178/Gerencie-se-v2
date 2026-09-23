"use client";

import dynamic from "next/dynamic";

/**
 * Carrega o PixiJS (e todo o motor do mascote, ver `engine/runtime.ts`)
 * só no cliente, em um chunk separado do bundle principal — hoje
 * `MascotPet` é renderizado incondicionalmente em todo `/home/**`
 * (`src/app/home/layout.tsx`), então sem isso o PixiJS entraria no JS
 * inicial de toda a área autenticada. `ssr: false` é necessário: o motor
 * manipula um `<canvas>` diretamente via DOM, nunca faz sentido rodar no
 * servidor.
 */
export const MascotPet = dynamic(() => import("./index").then((mod) => mod.MascotPet), {
  ssr: false,
});

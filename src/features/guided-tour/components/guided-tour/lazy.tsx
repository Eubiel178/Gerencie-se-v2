"use client";

import dynamic from "next/dynamic";

/**
 * Carrega o tour guiado só no cliente, em chunk separado - ele só
 * interessa a quem ainda não viu (a maioria das sessões nunca vai
 * precisar dele), então não faz sentido no JS inicial de toda `/home/**`.
 * `ssr: false` também é o que permite ao componente calcular os passos
 * direto no `useState` inicial (lendo `document`/`window`), sem precisar
 * de um efeito só pra isso - ver `index.tsx`.
 */
export const GuidedTour = dynamic(() => import("./index").then((mod) => mod.GuidedTour), {
  ssr: false,
});

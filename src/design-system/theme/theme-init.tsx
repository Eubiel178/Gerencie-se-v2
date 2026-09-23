"use client";

import { useLayoutEffect } from "react";

const STORAGE_KEY = "gerencie-se:theme";

/**
 * Aplica o tema salvo (ver `use-theme.ts`) assim que o app monta no
 * cliente — `useLayoutEffect` roda antes do navegador pintar o próximo
 * frame, então na prática não há flash perceptível.
 *
 * Antes disso rodava via `next/script` (`strategy="beforeInteractive"`),
 * pra garantir zero flash mesmo antes da hidratação. Trocado porque,
 * nesta versão do Next (16.3.4) + Turbopack, o próprio `next/script`
 * renderiza a tag `beforeInteractive` como um `<script>` de verdade sob
 * o capô — e isso disparava o aviso/erro do React "Encountered a script
 * tag..." (e, no overlay de dev do Turbopack, chegava a travar a tela
 * com "A server error occurred"), de forma consistente o suficiente pra
 * atrapalhar o uso normal do app. Sem solução de contorno viável sem
 * abrir mão de `beforeInteractive` — a troca aceita um risco pequeno de
 * flash em favor de nunca mais travar a tela.
 */
export function ThemeInit() {
  useLayoutEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "light" || stored === "dark") {
        document.documentElement.setAttribute("data-theme", stored);
      }
    } catch {
      // Ignorado de propósito — localStorage indisponível (modo privado,
      // por exemplo) só significa que o tema segue o sistema.
    }
  }, []);

  return null;
}

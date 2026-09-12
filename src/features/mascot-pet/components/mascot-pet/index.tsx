"use client";

import { useEffect, useRef } from "react";

import { DEFAULT_MASCOT_CHARACTER_ID, MASCOT_CHARACTERS } from "@/features/mascot-pet/domain/characters";
import { MascotRuntime } from "@/features/mascot-pet/engine/runtime";

import styles from "./mascot-pet.module.css";

/**
 * Bichinho de estimação 2D (PixiJS) que anda livremente pela tela,
 * sobreposto à interface - ver `engine/runtime.ts` pro motor real
 * (movimento/animação/estado), que roda inteiramente fora do React
 * (nenhum re-render por frame). Este componente só monta/desmonta o
 * runtime e nunca deve aparecer mais de uma vez na árvore (garantido
 * hoje por ser renderizado uma única vez em `src/app/home/layout.tsx`).
 */
export function MascotPet() {
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const character = MASCOT_CHARACTERS[DEFAULT_MASCOT_CHARACTER_ID];
    const runtime = new MascotRuntime({ wrapper }, character);
    let cancelled = false;

    runtime.mount().catch((error: unknown) => {
      if (!cancelled) console.error("[mascot-pet] falha ao inicializar o PixiJS", error);
    });

    return () => {
      cancelled = true;
      runtime.destroy();
    };
  }, []);

  return (
    <div ref={containerRef} className={styles.stage} aria-hidden="true">
      <div ref={wrapperRef} className={styles.wrapper} />
    </div>
  );
}

"use client";

import { useEffect, useRef } from "react";

import { DEFAULT_MASCOT_CHARACTER_ID, MASCOT_CHARACTERS } from "@/features/mascot-pet/domain/characters";
import { MascotRuntime } from "@/features/mascot-pet/engine/runtime";

import styles from "./mascot-pet.module.css";

interface MascotPetProps {
  /** Id de personagem (ver `MASCOT_CHARACTERS`) - normalmente calculado a
   * partir da espécie escolhida em Configurações via
   * `characterIdForSpecies`. `undefined`/id desconhecido cai no padrão;
   * `null` explícito não renderiza nada (espécie escolhida ainda sem
   * atlas próprio). */
  characterId?: string | null;
}

/**
 * Bichinho de estimação 2D (PixiJS) que anda livremente pela tela,
 * sobreposto à interface - ver `engine/runtime.ts` pro motor real
 * (movimento/animação/estado), que roda inteiramente fora do React
 * (nenhum re-render por frame). Este componente só monta/desmonta o
 * runtime e nunca deve aparecer mais de uma vez na árvore (garantido
 * hoje por ser renderizado uma única vez em `src/app/home/layout.tsx`).
 */
export function MascotPet({ characterId }: MascotPetProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const resolvedId = characterId === null ? null : (characterId ?? DEFAULT_MASCOT_CHARACTER_ID);
  const character = resolvedId ? MASCOT_CHARACTERS[resolvedId] : undefined;

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper || !character) return;

    const runtime = new MascotRuntime({ wrapper }, character);
    let cancelled = false;

    runtime.mount().catch((error: unknown) => {
      if (!cancelled) console.error("[mascot-pet] falha ao inicializar o PixiJS", error);
    });

    return () => {
      cancelled = true;
      runtime.destroy();
    };
    // Reexecuta (destrói e remonta com o novo bicho) quando a espécie
    // escolhida em Configurações muda - `character` já é a referência
    // certa pro id atual.
  }, [character]);

  if (!character) return null;

  return (
    <div className={styles.stage} aria-hidden="true">
      <div ref={wrapperRef} className={styles.wrapper} />
    </div>
  );
}

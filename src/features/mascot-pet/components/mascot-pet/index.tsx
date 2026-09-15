"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

import { DEFAULT_MASCOT_CHARACTER_ID, MASCOT_CHARACTERS } from "@/features/mascot-pet/domain/characters";
import { isQuietModeRoute } from "@/features/mascot-pet/engine/quiet-mode-routes";
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
  const runtimeRef = useRef<MascotRuntime | null>(null);
  const pathname = usePathname();
  const resolvedId = characterId === null ? null : (characterId ?? DEFAULT_MASCOT_CHARACTER_ID);
  const character = resolvedId ? MASCOT_CHARACTERS[resolvedId] : undefined;

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper || !character) return;

    const runtime = new MascotRuntime({ wrapper }, character);
    runtimeRef.current = runtime;
    let cancelled = false;

    runtime.mount().catch((error: unknown) => {
      if (!cancelled) console.error("[mascot-pet] falha ao inicializar o PixiJS", error);
    });

    return () => {
      cancelled = true;
      runtimeRef.current = null;
      runtime.destroy();
    };
    // Reexecuta (destrói e remonta com o novo bicho) quando a espécie
    // escolhida em Configurações muda - `character` já é a referência
    // certa pro id atual.
  }, [character]);

  // Modo Foco (e outras rotas densas — ver `QUIET_MODE_ROUTE_PREFIXES` em
  // `engine/quiet-mode-routes.ts` pro motivo de cada uma): presença
  // reduzida enquanto a pessoa está tentando se concentrar - "no conflito
  // entre personalidade e concentração, concentração vence" (pedido
  // explícito). Efeito separado do de montagem: só precisa reagir a
  // MUDANÇA de rota, nunca remonta o runtime inteiro por isso.
  useEffect(() => {
    runtimeRef.current?.setQuietMode(isQuietModeRoute(pathname));
  }, [pathname]);

  if (!character) return null;

  return (
    <div className={styles.stage} aria-hidden="true">
      <div ref={wrapperRef} className={styles.wrapper} />
    </div>
  );
}

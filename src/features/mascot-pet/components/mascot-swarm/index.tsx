"use client";

import { useEffect, useRef, useState } from "react";

import { MASCOT_CHARACTERS } from "@/features/mascot-pet/domain/characters";
import { MascotBounds } from "@/features/mascot-pet/engine/movement";
import { MascotRuntime } from "@/features/mascot-pet/engine/runtime";

import styles from "./mascot-swarm.module.css";

// Todos os personagens já disponíveis no sistema (ver CREDITS.txt em
// public/mascot/pet - cada um já verificado: pixel art 2D, fundo
// transparente de verdade, boa leitura em tamanho pequeno). Em telas
// estreitas mostramos só um subconjunto (ver `useVisibleCharacterIds`) -
// nunca todos os 5 ao mesmo tempo num espaço pequeno demais pra eles
// terem raio de passeio de verdade.
const DESKTOP_CHARACTER_IDS = ["cat", "dog", "bird", "bear", "fox", "panda"];
const MOBILE_CHARACTER_IDS = ["cat", "fox", "bird"];
const MOBILE_BREAKPOINT_PX = 760;

const STAGE_MARGIN_PX = 10;

function matchesMobile(): boolean {
  return window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT_PX}px)`).matches;
}

// Este componente só existe dentro de um `dynamic(..., { ssr: false })`
// (ver `lazy.tsx`) - nunca renderiza no servidor, então ler `window` já
// no estado inicial é seguro (sem isso, a primeira montagem sempre
// assumiria desktop e montaria/desmontaria os bichos de novo no
// primeiro efeito em telas estreitas).
function useVisibleCharacterIds(): string[] {
  const [ids, setIds] = useState(() => (matchesMobile() ? MOBILE_CHARACTER_IDS : DESKTOP_CHARACTER_IDS));

  useEffect(() => {
    const query = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT_PX}px)`);
    const apply = () => setIds(query.matches ? MOBILE_CHARACTER_IDS : DESKTOP_CHARACTER_IDS);

    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, []);

  return ids;
}

/** Cada bicho anda livre só dentro da própria "raia" vertical do palco -
 * nunca a área inteira. Sem isso, com todos soltos no mesmo espaço, a
 * tendência é eles se amontoarem no centro (onde o alvo aleatório de
 * qualquer um tem mais chance de cair) e passarem a maior parte do tempo
 * sobrepostos - o motor não tem (e não precisa ganhar) detecção de
 * colisão entre bichos: distribuir o espaço de propósito já evita o
 * amontoado sem isso. */
function makeLaneBoundsProvider(
  stage: HTMLDivElement,
  laneIndex: number,
  laneCount: number
): (displayWidth: number, displayHeight: number) => MascotBounds {
  return (displayWidth, displayHeight) => {
    const rect = stage.getBoundingClientRect();
    const laneWidth = rect.width / laneCount;
    const laneMinX = laneIndex * laneWidth + STAGE_MARGIN_PX;
    const laneMaxXRaw = (laneIndex + 1) * laneWidth - STAGE_MARGIN_PX - displayWidth;
    const laneMaxX = Math.max(laneMaxXRaw, laneMinX + 1);

    const minY = STAGE_MARGIN_PX;
    const maxY = Math.max(rect.height - displayHeight - STAGE_MARGIN_PX, minY);

    return { minX: laneMinX, maxX: laneMaxX, minY, maxY };
  };
}

// Posição/tamanho/opacidade de cada árvore decorativa - valores fixos
// (não geometria calculada), pensados só pra dar profundidade de "clareira"
// sem competir com os bichos: menores e mais claras ao fundo, maiores e
// mais nítidas na frente, nunca no centro (onde os bichos passeiam).
const TREES = [
  { left: "4%", scale: 0.8, opacity: 0.35 },
  { left: "13%", scale: 1.05, opacity: 0.5 },
  { left: "88%", scale: 0.9, opacity: 0.4 },
  { left: "95%", scale: 1.15, opacity: 0.55 },
] as const;

function Tree({ scale, opacity }: { scale: number; opacity: number }) {
  return (
    <svg
      viewBox="0 0 40 56"
      width={40 * scale}
      height={56 * scale}
      className={styles.tree}
      style={{ opacity }}
    >
      <rect x="17" y="38" width="6" height="18" rx="1.5" fill="var(--color-text)" />
      <circle cx="20" cy="30" r="12" fill="var(--color-success)" />
      <circle cx="11" cy="22" r="9" fill="var(--color-success)" />
      <circle cx="29" cy="22" r="9" fill="var(--color-success)" />
      <circle cx="20" cy="14" r="10" fill="var(--color-success)" />
    </svg>
  );
}

/** Fundo decorativo da vitrine (árvores paradas nas laterais) - puramente
 * visual, nunca recebe interação nem concorre com o rótulo de nome dos
 * bichos (ver `.tree` em `mascot-swarm.module.css`: `pointer-events:none`,
 * abaixo dos wrappers na ordem do DOM). */
function Scenery() {
  return (
    <div className={styles.scenery} aria-hidden="true">
      {TREES.map((tree, index) => (
        <div key={index} className={styles.treeSlot} style={{ left: tree.left }}>
          <Tree scale={tree.scale} opacity={tree.opacity} />
        </div>
      ))}
    </div>
  );
}

/**
 * Pequena "vitrine viva" com vários personagens do mascote (ver
 * `MASCOT_CHARACTERS`) passeando ao mesmo tempo, livres dentro de uma
 * área da Landing Page - REUTILIZA o mesmo motor PixiJS do bichinho que
 * anda pela área autenticada (`MascotRuntime`/`MascotBehavior`), só com
 * limites próprios (confinados ao palco, não à janela inteira) e uma
 * chave de instância por personagem, pra várias instâncias conviverem
 * (ver `MascotRuntimeOptions` em `engine/runtime.ts`). Nenhuma lógica de
 * movimento/animação é duplicada aqui - este componente só monta o
 * runtime com as opções certas e desenha um rótulo de nome no hover.
 */
export function MascotSwarm() {
  const stageRef = useRef<HTMLDivElement>(null);
  const wrapperRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const visibleIds = useVisibleCharacterIds();
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const runtimes = visibleIds
      .map((id, index) => {
        const wrapper = wrapperRefs.current[id];
        const character = MASCOT_CHARACTERS[id];
        if (!wrapper || !character) return null;

        return new MascotRuntime(
          { wrapper },
          character,
          {
            instanceGroup: `landing-swarm-${id}`,
            boundsProvider: makeLaneBoundsProvider(stage, index, visibleIds.length),
          }
        );
      })
      .filter((runtime): runtime is MascotRuntime => runtime !== null);

    runtimes.forEach((runtime) => {
      runtime.mount().catch((error: unknown) => {
        console.error("[mascot-swarm] falha ao inicializar o PixiJS", error);
      });
    });

    return () => {
      runtimes.forEach((runtime) => runtime.destroy());
    };
  }, [visibleIds]);

  return (
    <div className={styles.stage} ref={stageRef}>
      <Scenery />

      {visibleIds.map((id) => {
        const character = MASCOT_CHARACTERS[id];
        if (!character) return null;

        return (
          <div
            key={id}
            ref={(node) => {
              wrapperRefs.current[id] = node;
            }}
            className={styles.wrapper}
            onPointerEnter={() => setHoveredId(id)}
            onPointerLeave={() => setHoveredId((current) => (current === id ? null : current))}
          >
            <span className={styles.label} data-visible={hoveredId === id}>
              {character.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

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

type TreeVariant = "round" | "pine" | "slim";

// Posição/variante/tamanho/opacidade de cada árvore decorativa - valores
// fixos (não geometria calculada), pensados só pra dar profundidade de
// "clareira" sem competir com os bichos: menores e mais claras ao fundo,
// maiores e mais nítidas na frente, nunca no centro (onde os bichos
// passeiam). Variam tanto de FORMA (3 silhuetas diferentes - `TreeVariant`)
// quanto de ALTURA de verdade (não só escala uniforme do mesmo desenho -
// achado relatado: "crie árvores altas e diferentes") - cada uma com sua
// própria proporção largura/altura, não um reescalonamento isotrópico da
// mesma arte.
const TREES: { left: string; variant: TreeVariant; scale: number; opacity: number }[] = [
  { left: "3%", variant: "pine", scale: 0.75, opacity: 0.32 },
  { left: "10%", variant: "round", scale: 1, opacity: 0.48 },
  { left: "18%", variant: "slim", scale: 0.85, opacity: 0.38 },
  { left: "84%", variant: "slim", scale: 0.9, opacity: 0.4 },
  { left: "90%", variant: "pine", scale: 1.05, opacity: 0.5 },
  { left: "97%", variant: "round", scale: 1.2, opacity: 0.58 },
];

// 3 silhuetas bem diferentes entre si (não a mesma arte reescalada) -
// achado relatado: "crie árvores altas e diferentes" (a versão anterior,
// embora já corrigida de "feia" pra uma copa de verdade, ainda repetia a
// MESMA árvore em todo slot, só maior/menor/mais opaca). Todas nascem de
// um `viewBox` mais alto que largo pra reforçar a sensação de altura.
// Cores do tronco/copa fixas de propósito (não são token do design
// system - é só a paleta desta ilustração decorativa, mesmo espírito das
// cores fixas no e-mail de convite).

/** Frondosa - copa em 3 elipses decrescendo de baixo pra cima (silhueta
 * afunilada clássica) com 3 tons de verde (mais escuro embaixo/atrás,
 * mais claro em cima/na frente). */
function RoundTree() {
  return (
    <>
      <rect x="19" y="46" width="6" height="20" rx="2" fill="#8a6a48" />
      <rect x="19" y="46" width="3" height="20" rx="1.5" fill="#9c7a55" />

      <ellipse cx="22" cy="42" rx="17" ry="14" fill="var(--color-success)" opacity="0.75" />
      <ellipse cx="22" cy="28" rx="14" ry="12" fill="var(--color-success)" opacity="0.88" />
      <ellipse
        cx="22"
        cy="15"
        rx="10.5"
        ry="9.5"
        fill="color-mix(in srgb, var(--color-success) 70%, white)"
      />
    </>
  );
}

/** Conífera alta e estreita - 4 "camadas" triangulares empilhadas,
 * encolhendo pra cima, tronco fino e comprido - a mais alta das 3 pra
 * variar a "linha do horizonte" da clareira. */
function PineTree() {
  return (
    <>
      <rect x="20" y="58" width="4" height="14" rx="1.5" fill="#8a6a48" />

      <path d="M22 4 L34 24 L10 24 Z" fill="color-mix(in srgb, var(--color-success) 65%, white)" />
      <path d="M22 16 L36 38 L8 38 Z" fill="var(--color-success)" opacity="0.85" />
      <path d="M22 30 L38 52 L6 52 Z" fill="var(--color-success)" opacity="0.75" />
      <path d="M22 44 L40 66 L4 66 Z" fill="var(--color-success)" opacity="0.65" />
    </>
  );
}

/** Esguia - tronco longo e fino com uma copa pequena e alta no topo
 * (tipo bétula/pau-de-vela) - contraste de silhueta com as outras duas,
 * mais "vazia" embaixo. */
function SlimTree() {
  return (
    <>
      <rect x="20" y="30" width="4" height="42" rx="1.5" fill="#a68763" />
      <rect x="20" y="30" width="2" height="42" rx="1" fill="#bb9c78" />

      <ellipse cx="22" cy="20" rx="9" ry="12" fill="var(--color-success)" opacity="0.8" />
      <ellipse
        cx="22"
        cy="8"
        rx="6.5"
        ry="8.5"
        fill="color-mix(in srgb, var(--color-success) 70%, white)"
      />
    </>
  );
}

const TREE_VARIANTS: Record<TreeVariant, () => React.ReactElement> = {
  round: RoundTree,
  pine: PineTree,
  slim: SlimTree,
};

function Tree({ variant, scale, opacity }: { variant: TreeVariant; scale: number; opacity: number }) {
  const Variant = TREE_VARIANTS[variant];

  return (
    <svg
      viewBox="0 0 44 72"
      width={44 * scale}
      height={72 * scale}
      className={styles.tree}
      style={{ opacity }}
    >
      <Variant />
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
          <Tree variant={tree.variant} scale={tree.scale} opacity={tree.opacity} />
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

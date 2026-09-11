"use client";

import dynamic from "next/dynamic";

import { MascotEvent, MascotRenderMode, MascotSpecies } from "@/features/focus/domain";
import { MascotCreature } from "@/features/focus/components/mascot/creature";

import { useWebglSupport } from "./use-webgl-support";
import { Mascot3DErrorBoundary } from "./error-boundary";

import styles from "./mascot-3d.module.css";

const MascotScene = dynamic(() => import("./scene").then((module) => module.MascotScene), {
  ssr: false,
});

interface MascotVisualProps {
  species: MascotSpecies;
  mood: MascotEvent;
  level: number;
  renderMode: MascotRenderMode;
  roaming?: boolean;
  size?: "sm" | "lg";
}

/**
 * Ponto único que decide entre o mascote em CSS (`MascotCreature`,
 * padrão) e a versão em Three.js (`renderMode === "3d"`, opt-in em
 * Configurações). Nunca tenta o 3D sem suporte a WebGL confirmado, e
 * qualquer erro de execução no Canvas cai de volta pro CSS sozinho —
 * o mascote antigo nunca some de verdade, só fica escondido atrás.
 */
export function MascotVisual({ species, mood, level, renderMode, roaming, size }: MascotVisualProps) {
  const webglSupported = useWebglSupport();

  if (renderMode === "2d" || webglSupported !== true) {
    return <MascotCreature species={species} mood={mood} roaming={roaming} size={size} />;
  }

  return (
    <Mascot3DErrorBoundary
      fallback={<MascotCreature species={species} mood={mood} roaming={roaming} size={size} />}
    >
      <div className={styles.canvasWrapper} data-size={size ?? "lg"}>
        <MascotScene species={species} mood={mood} level={level} />
      </div>
    </Mascot3DErrorBoundary>
  );
}

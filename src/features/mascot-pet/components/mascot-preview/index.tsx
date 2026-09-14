"use client";

import { useEffect, useState } from "react";

import { MascotCharacter, MascotFrameRect, MascotStateName } from "@/features/mascot-pet/domain/types";
import { MASCOT_CHARACTERS } from "@/features/mascot-pet/domain/characters";

import styles from "./mascot-preview.module.css";

// Teto pro tamanho do palco (px) - ver comentário completo onde é usado,
// dentro de `MascotPreviewFrames`.
const MAX_STAGE_PX = 180;

interface MascotPreviewProps {
  /** Id de personagem (ver `MASCOT_CHARACTERS`) — `null`/id desconhecido
   * não renderiza nada. */
  characterId: string | null;
  state?: MascotStateName;
  /** Ampliação do frame nativo (110x96) — 1 = tamanho original. */
  scale?: number;
  animated?: boolean;
  label?: string;
}

/**
 * Prévia leve (sem PixiJS) do MESMO atlas usado pelo mascote que anda
 * pela tela — recorta o frame certo via CSS (posicionamento negativo de
 * uma <img> dentro de um container com `overflow:hidden`), sem criar uma
 * segunda instância do motor de animação. Reaproveitada onde antes havia
 * o mascote antigo (Focus, avatar do JARVIS, prévia de Configurações) —
 * assim a mesma imagem que anda pela tela é a que aparece nesses lugares,
 * em vez de um desenho separado.
 */
export function MascotPreview({ characterId, state = "idle", scale = 1, animated = true, label }: MascotPreviewProps) {
  const character = characterId ? MASCOT_CHARACTERS[characterId] : undefined;
  if (!character) return null;

  return (
    <MascotPreviewFrames
      // Remonta (e reinicia o índice do frame do zero) sempre que trocar
      // de personagem ou de estado — mais simples que resetar via efeito.
      key={`${character.id}-${state}`}
      character={character}
      state={state}
      scale={scale}
      animated={animated}
      label={label}
    />
  );
}

interface MascotPreviewFramesProps {
  character: MascotCharacter;
  state: MascotStateName;
  scale: number;
  animated: boolean;
  label?: string;
}

function MascotPreviewFrames({ character, state, scale, animated, label }: MascotPreviewFramesProps) {
  const frames = character.animations[state];
  const [frameIndex, setFrameIndex] = useState(0);

  useEffect(() => {
    if (!animated || frames.length <= 1) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const interval = setInterval(() => {
      setFrameIndex((current) => (current + 1) % frames.length);
    }, 1000 / character.frameRate);

    return () => clearInterval(interval);
  }, [frames, animated, character.frameRate]);

  const frameName = frames[frameIndex] ?? frames[0];
  const rect: MascotFrameRect | undefined = frameName ? character.frameRects[frameName] : undefined;
  if (!rect) return null;

  // Personagens em atlas pixel art pequeno (32x32) declaram
  // `displayWidth`/`pixelArt` pro motor que anda pela tela (ver
  // engine/runtime.ts) - essa prévia (sem PixiJS) precisa do mesmo ajuste
  // pra não mostrar o bicho minúsculo/borrado aqui também.
  const pixelArtScale = character.pixelArt && character.displayWidth
    ? character.displayWidth / character.frameWidth
    : 1;
  const effectiveScale = scale * pixelArtScale;

  // Alguns personagens (cães/gatos das raças novas) têm o bicho ocupando
  // só uma fração pequena do próprio frame (~22-38%, medido com pixels
  // reais - ver CREDITS.txt) - o `displayWidth` deles foi calibrado pro
  // TAMANHO APARENTE do bicho ficar bom andando pela tela (fundo vazio,
  // a folga transparente do frame não aparece), mas aplicado direto aqui
  // (onde o palco é uma caixa de verdade no layout) essa mesma folga virava
  // um espaço vazio enorme ao redor de um bicho pequeno no meio (achado
  // relatado). Limitar o palco a um tamanho máximo - cortando a folga
  // (nunca o bicho, que fica centralizado, ver CSS `transform-origin`) -
  // resolve pros dois casos sem precisar de um cálculo por personagem.
  const stageWidth = Math.min(rect.w * effectiveScale, MAX_STAGE_PX);
  const stageHeight = Math.min(rect.h * effectiveScale, MAX_STAGE_PX);

  return (
    <div
      className={styles.stage}
      style={{ width: stageWidth, height: stageHeight }}
      role="img"
      aria-label={label ?? character.label}
    >
      <div
        className={styles.crop}
        style={{
          width: rect.w,
          height: rect.h,
          transform: `scale(${effectiveScale})`,
          imageRendering: character.pixelArt ? "pixelated" : undefined,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- precisa de posicionamento em pixel exato do atlas, o que foge do que <Image> otimiza */}
        <img
          src={character.atlasImageUrl}
          alt=""
          aria-hidden="true"
          className={styles.atlas}
          style={{ left: -rect.x, top: -rect.y }}
        />
      </div>
    </div>
  );
}

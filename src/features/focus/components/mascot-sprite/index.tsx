import Image from "next/image";

import { MascotBreed, MascotEvent, MascotSpecies } from "@/features/focus/domain";

import styles from "./mascot-sprite.module.css";

const SPECIES_LABEL: Record<MascotSpecies, string> = {
  gato: "Gato",
  cachorro: "Cachorro",
  coelho: "Coelho",
  galinha: "Galinha",
};

// Sprites pequenos/em pixel art (ver public/mascot/CREDITS.txt) —
// precisam de `image-rendering: pixelated` ao serem ampliados, senão o
// navegador borra os pixels. Os de gato/cachorro são desenhos vetoriais
// em alta resolução, escalam bem com suavização normal.
const PIXELATED_SPECIES = new Set<MascotSpecies>(["coelho", "galinha"]);

function spriteSrc(species: MascotSpecies, breed: MascotBreed): string {
  const extension = species === "galinha" ? "gif" : "png";
  return `/mascot/${species}-${breed}.${extension}`;
}

interface MascotSpriteProps {
  species: MascotSpecies;
  breed: MascotBreed;
  mood: MascotEvent;
  /** Anima o vaivém de um lado pro outro (usado no Focus); desativado na
   * pré-visualização de Configurações, onde um bicho se mexendo sozinho
   * dentro de um formulário só distrai. */
  roaming?: boolean;
  /** "sm" encolhe o mesmo sprite (via transform) pro avatar do widget do
   * assistente — é o mesmo mascote, só menor. */
  size?: "sm" | "lg";
}

/**
 * Corpo do mascote: um sprite estático (PNG/GIF) por espécie+raça,
 * animado via CSS de acordo com o `mood` — idle (respirando devagar),
 * working (respirando mais rápido, sem vaivém) e happy (pulinho +
 * brilhos). Reaproveitado no Focus (`Mascot`), na pré-visualização de
 * Configurações (`MascotSettings`) e no avatar do widget do assistente
 * (`Widget`) — os três mostram o MESMO personagem.
 */
export function MascotSprite({ species, breed, mood, roaming = false, size = "lg" }: MascotSpriteProps) {
  return (
    <div className={styles.stage} data-roaming={roaming} data-size={size}>
      <div className={styles.roamer}>
        <div className={styles.body} data-mood={mood}>
          <Image
            src={spriteSrc(species, breed)}
            alt={SPECIES_LABEL[species]}
            width={128}
            height={128}
            unoptimized={species === "galinha"}
            className={`${styles.image} ${PIXELATED_SPECIES.has(species) ? styles.pixelated : ""}`}
            priority={size === "lg"}
          />

          {mood === "happy" && (
            <>
              <span className={`${styles.sparkle} ${styles.sparkleOne}`}>✦</span>
              <span className={`${styles.sparkle} ${styles.sparkleTwo}`}>✦</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

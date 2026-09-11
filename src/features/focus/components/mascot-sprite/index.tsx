import Image from "next/image";

import { MascotEvent, MascotSpecies } from "@/features/focus/domain";

import styles from "./mascot-sprite.module.css";

// PNG estático por espécie (CC0, "Animal Pack Remastered" da Kenney —
// ver public/mascot/CREDITS.txt), animado só via CSS. Cada chave aqui
// precisa ter um arquivo correspondente em public/mascot/.
const SPECIES_IMAGE: Record<MascotSpecies, string> = {
  galinha: "/mascot/galinha.png",
  vaca: "/mascot/vaca.png",
  porco: "/mascot/porco.png",
  cabra: "/mascot/cabra.png",
};

const SPECIES_LABEL: Record<MascotSpecies, string> = {
  galinha: "Galinha",
  vaca: "Vaca",
  porco: "Porco",
  cabra: "Cabra",
};

interface MascotSpriteProps {
  species: MascotSpecies;
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
 * Corpo do mascote: um sprite estático (PNG) por espécie, animado via
 * CSS de acordo com o `mood` — idle (respirando devagar), working
 * (respirando mais rápido, sem vaivém) e happy (pulinho + brilhos).
 * Reaproveitado no Focus (`Mascot`), na pré-visualização de
 * Configurações (`MascotSettings`) e no avatar do widget do assistente
 * (`Widget`) — os três mostram o MESMO personagem.
 */
export function MascotSprite({ species, mood, roaming = false, size = "lg" }: MascotSpriteProps) {
  return (
    <div className={styles.stage} data-roaming={roaming} data-size={size}>
      <div className={styles.roamer}>
        <div className={styles.body} data-mood={mood}>
          <Image
            src={SPECIES_IMAGE[species]}
            alt={SPECIES_LABEL[species]}
            width={128}
            height={128}
            className={styles.image}
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

import { MascotEvent, MascotSpecies } from "@/features/focus/domain";

import styles from "./mascot.module.css";

interface MascotCreatureProps {
  species: MascotSpecies;
  mood: MascotEvent;
  /** Desativa a animação de "andar de um lado pro outro" — usado na
   * pré-visualização de Configurações, onde um bicho se mexendo sozinho
   * dentro de um formulário só distrai. */
  roaming?: boolean;
  /** "sm" encolhe o mesmo corpo (via transform, mesmo desenho) pro avatar
   * do widget do assistente — é o mesmo mascote, só menor. */
  size?: "sm" | "lg";
}

/**
 * Corpo do mascote, sem o balão de fala nem o nome/XP em volta — só a
 * parte visual, pra poder ser reaproveitada no Focus (`Mascot`), na
 * pré-visualização ao vivo de Configurações (`MascotSettings`) e no
 * avatar do widget do assistente (`Widget`) — os três mostram o MESMO
 * personagem. Espécie muda só enfeites (orelhas/rabo/focinho) por cima
 * do mesmo blob base — nenhum asset novo, tudo CSS.
 */
export function MascotCreature({ species, mood, roaming = false, size = "lg" }: MascotCreatureProps) {
  return (
    <div className={styles.stage} data-roaming={roaming} data-size={size}>
      <div className={styles.roamer}>
        <div className={styles.creature} data-mood={mood} data-species={species} aria-hidden="true">
          {species === "gato" && (
            <>
              <span className={`${styles.ear} ${styles.earLeft}`} />
              <span className={`${styles.ear} ${styles.earRight}`} />
              <span className={styles.tail} />
            </>
          )}

          {species === "cachorro" && (
            <>
              <span className={`${styles.floppyEar} ${styles.floppyEarLeft}`} />
              <span className={`${styles.floppyEar} ${styles.floppyEarRight}`} />
              <span className={styles.snout} />
            </>
          )}

          <div className={styles.eyes}>
            <span className={styles.eye} />
            <span className={styles.eye} />
          </div>
          <div className={styles.cheeks}>
            <span className={styles.cheek} />
            <span className={styles.cheek} />
          </div>
          <span className={styles.mouth} />
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

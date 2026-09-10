import { Card } from "@/features/dashboard/components/shared";

import { IMascotState } from "@/features/focus/domain";

import styles from "./mascot-card.module.css";

export function MascotCard({ mascot }: { mascot: IMascotState }) {
  const percent = Math.round((mascot.xpIntoCurrentLevel / mascot.xpForNextLevel) * 100);

  return (
    <Card title="Foco" href="/home/focus" linkLabel="Iniciar foco">
      <div className={styles.row}>
        <span className={styles.mascotEmoji} aria-hidden="true">
          🐣
        </span>

        <div className={styles.info}>
          <span className={styles.name}>
            {mascot.name} · nível {mascot.level}
          </span>

          <div className={styles.track}>
            <div className={styles.fill} style={{ width: `${percent}%` }} />
          </div>

          <span className={styles.xp}>
            {mascot.xpIntoCurrentLevel}/{mascot.xpForNextLevel} XP
          </span>
        </div>
      </div>
    </Card>
  );
}

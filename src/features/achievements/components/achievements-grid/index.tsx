import dayjs from "dayjs";

import { Icon } from "@/components";
import { AchievementView } from "@/features/achievements/get-achievements-status";

import styles from "./styles.module.css";

export function AchievementsGrid({ achievements }: { achievements: AchievementView[] }) {
  return (
    <ul className={styles.grid}>
      {achievements.map((achievement) => (
        <li
          key={achievement.id}
          className={styles.item}
          data-unlocked={achievement.unlocked}
          aria-label={`${achievement.name}: ${achievement.unlocked ? "desbloqueada" : "bloqueada"}`}
        >
          <span className={styles.iconWrapper}>
            <Icon name={achievement.icon} size={20} />
          </span>

          <div className={styles.text}>
            <p className={styles.name}>{achievement.name}</p>
            <p className={styles.description}>{achievement.description}</p>
            {achievement.unlocked && achievement.unlockedAt && (
              <p className={styles.unlockedAt}>
                Desbloqueada em {dayjs(achievement.unlockedAt).format("DD/MM/YYYY")}
              </p>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

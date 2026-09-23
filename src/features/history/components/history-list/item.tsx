import { Icon, IconName } from "@/components/icon";
import { formatTimeOnly } from "@/utils/date";

import { HistoryEntry } from "../../domain";

import styles from "./history-item.module.css";

const TYPE_ICONS: Record<HistoryEntry["type"], IconName> = {
  task: "FaListUl",
  goal: "FaBullseye",
  habit: "FaFire",
  routine: "MdOutlineSchedule",
  reading: "FaBook",
};

const TYPE_LABELS: Record<HistoryEntry["type"], string> = {
  task: "Tarefa concluída",
  goal: "Objetivo concluído",
  habit: "Hábito realizado",
  routine: "Item da rotina realizado",
  reading: "Livro finalizado",
};

interface HistoryItemProps {
  entry: HistoryEntry;
}

export function HistoryItem({ entry }: HistoryItemProps) {
  const icon = TYPE_ICONS[entry.type];
  const label = TYPE_LABELS[entry.type];
  const metadata = entry.metadata;

  return (
    <div className={styles.item}>
      <span className={styles.icon} aria-hidden="true">
        <Icon name={icon} />
      </span>

      <div className={styles.content}>
        <span className={styles.title}>{entry.title}</span>
        <span className={styles.meta}>
          <span className={styles.type}>{label}</span>
          <span className={styles.metaSep} aria-hidden="true">·</span>
          <span className={styles.time} suppressHydrationWarning>
            {formatTimeOnly(entry.completedAt)}
          </span>
        </span>
      </div>

      {metadata && (metadata.goalProgress !== undefined || metadata.author) && (
        <div className={styles.metadata} aria-hidden="true">
          {metadata.goalProgress !== undefined && (
            <span className={styles.badge}>{metadata.goalProgress}%</span>
          )}
          {metadata.author && <span className={styles.badge}>{metadata.author}</span>}
        </div>
      )}
    </div>
  );
}
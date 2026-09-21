import type { HistoryGroup } from "./group-entries";
import styles from "./history-group.module.css";
import { HistoryItem } from "./item";


interface HistoryGroupProps {
  group: HistoryGroup;
}

export function HistoryGroupComponent({ group }: HistoryGroupProps) {
  return (
    <div className={styles.group}>
      <h3 className={styles.groupLabel}>{group.label}</h3>
      <div className={styles.items}>
        {group.entries.map((entry) => (
          <HistoryItem key={entry.id} entry={entry} />
        ))}
      </div>
    </div>
  );
}
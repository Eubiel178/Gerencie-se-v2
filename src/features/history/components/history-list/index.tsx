import { HistoryEntry } from "../../domain";

import { HistoryGroupComponent } from "./group";
import { groupEntriesByDay } from "./group-entries";
import styles from "./history-list.module.css";

interface HistoryListProps {
  entries: HistoryEntry[];
}

export function HistoryList({ entries }: HistoryListProps) {
  const groups = groupEntriesByDay(entries);

  return (
    <div className={styles.list}>
      {groups.map((group) => (
        <HistoryGroupComponent key={group.date} group={group} />
      ))}
    </div>
  );
}
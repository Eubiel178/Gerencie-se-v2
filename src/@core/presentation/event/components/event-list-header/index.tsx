"use client";

import { AddEvent } from "../modal";
import styles from "../../../workspace.module.css";

export function EventListHeader() {
  return (
    <header className={styles.eventToolbar}>
      <h2>Próximos eventos</h2>

      <AddEvent buttonText="Novo" />
    </header>
  );
}

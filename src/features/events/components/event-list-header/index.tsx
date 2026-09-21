"use client";

import styles from "@/styles/workspace.module.css";

import { AddEvent } from "../modal";

export function EventListHeader() {
  return (
    <header className={styles.eventToolbar}>
      <h2>Próximos eventos</h2>

      <AddEvent buttonText="Novo Evento" />
    </header>
  );
}

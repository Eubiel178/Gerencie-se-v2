"use client";

import { Button } from "@/components";

import styles from "./offline.module.css";

export default function OfflinePage() {
  return (
    <div className={styles.wrapper}>
      <span className={styles.icon} aria-hidden="true">
        📡
      </span>

      <p className={styles.title}>Você está sem conexão</p>

      <p className={styles.description}>
        O Gerencie-se precisa de internet para carregar suas tarefas,
        hábitos e metas. Assim que a conexão voltar, tente novamente.
      </p>

      <Button onClick={() => window.location.reload()}>Tentar novamente</Button>
    </div>
  );
}

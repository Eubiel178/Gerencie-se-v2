"use client";

import { Button, Paragraph, Wrapper } from "@/components";

import styles from "./offline.module.css";

export default function OfflinePage() {
  return (
    <Wrapper direction="column" align="center" justify="center" gap="medium" padding="xlarge">
      <span className={styles.icon} aria-hidden="true">
        📡
      </span>

      <Paragraph size="large">Você está sem conexão</Paragraph>

      <Paragraph color="muted" size="small">
        O Gerencie-se precisa de internet para carregar suas tarefas,
        hábitos e metas. Assim que a conexão voltar, tente novamente.
      </Paragraph>

      <Button onClick={() => window.location.reload()}>Tentar novamente</Button>
    </Wrapper>
  );
}

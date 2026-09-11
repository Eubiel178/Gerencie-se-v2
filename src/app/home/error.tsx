"use client";

import { useEffect } from "react";

import { Button } from "@/components";

import styles from "./state-message.module.css";

export default function HomeError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log técnico para depuração — o usuário só vê a mensagem amigável abaixo.
    console.error(error);
  }, [error]);

  return (
    <div className={styles.wrapper}>
      <p className={styles.message}>
        Não conseguimos carregar suas informações agora. Verifique sua
        conexão e tente novamente.
      </p>

      <Button onClick={reset}>Tentar novamente</Button>
    </div>
  );
}

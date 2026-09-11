"use client";

import { useState } from "react";

import { Button } from "@/components";

import styles from "./notifications-toggle.module.css";

type PermissionState = NotificationPermission | "unsupported";

function readPermission(): PermissionState {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  return Notification.permission;
}

/**
 * Pede a permissão de notificação só a partir de um clique explícito
 * (gesto do usuário) — nunca sozinho no carregamento da página, o que
 * seria interromper por conta própria e, em vários navegadores, nem
 * dispara o prompt de verdade fora de um gesto.
 *
 * Lê `Notification.permission` no inicializador do useState (em vez de um
 * efeito) porque é um valor só-do-navegador que não precisa sincronizar
 * com nada externo depois do primeiro render - exatamente o caso em que
 * ler direto no estado inicial é preferível a um efeito.
 */
export function NotificationsToggle() {
  const [permission, setPermission] = useState<PermissionState>(readPermission);

  async function handleEnable() {
    const result = await Notification.requestPermission();
    setPermission(result);
  }

  if (permission === "unsupported") {
    return (
      <p className={styles.mutedText}>
        Seu navegador não aceita notificações.
      </p>
    );
  }

  if (permission === "granted") {
    return (
      <p className={styles.enabledMessage}>
        Notificações de lembrete ativadas.
      </p>
    );
  }

  if (permission === "denied") {
    return (
      <p className={styles.mutedText}>
        Notificações bloqueadas para este site. Para ativar, permita
        notificações do Gerencie-se nas configurações do seu navegador.
      </p>
    );
  }

  return (
    <div className={styles.container}>
      <p className={styles.mutedText}>
        Ative para receber lembretes de tarefas enquanto o Gerencie-se
        estiver aberto no navegador — fechar o navegador cancela os
        lembretes pendentes, já que não há um servidor de notificações
        por trás disso.
      </p>

      <div className={styles.buttonRow}>
        <Button.Root type="button" size="sm" onClick={handleEnable}>
          Ativar notificações de lembrete
        </Button.Root>
      </div>
    </div>
  );
}

"use client";

import { useState, useSyncExternalStore } from "react";

import { Button } from "@/components";

import styles from "./notifications-toggle.module.css";

type PermissionState = NotificationPermission | "unsupported";

// `Notification.permission` só existe no navegador — ler direto num
// inicializador de `useState` fazia o servidor sempre renderizar
// "unsupported" (sem `window`) enquanto o cliente já lia o valor real,
// dando hydration mismatch sempre que a permissão real não fosse
// "unsupported". `useSyncExternalStore` resolve isso: a primeira
// renderização no cliente usa o mesmo snapshot do servidor, e só depois
// (sem re-hidratar) troca pro valor real do navegador.
function subscribeNoop() {
  return () => {};
}
function getServerPermissionSnapshot(): PermissionState {
  return "unsupported";
}
function getClientPermissionSnapshot(): PermissionState {
  if (!("Notification" in window)) return "unsupported";
  return Notification.permission;
}

/**
 * Pede a permissão de notificação só a partir de um clique explícito
 * (gesto do usuário) — nunca sozinho no carregamento da página, o que
 * seria interromper por conta própria e, em vários navegadores, nem
 * dispara o prompt de verdade fora de um gesto.
 */
export function NotificationsToggle() {
  const browserPermission = useSyncExternalStore(
    subscribeNoop,
    getClientPermissionSnapshot,
    getServerPermissionSnapshot
  );

  // Depois de um clique em "Ativar", o navegador não emite nenhum evento
  // que `useSyncExternalStore` possa observar — guarda o resultado dessa
  // chamada à parte pra refletir na hora, sem esperar um re-render vindo
  // de outro lugar.
  const [justRequested, setJustRequested] = useState<PermissionState | null>(null);
  const permission = justRequested ?? browserPermission;

  async function handleEnable() {
    const result = await Notification.requestPermission();
    setJustRequested(result);
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
        <Button.Root type="button" className={styles.smallButton} onClick={handleEnable}>
          Ativar notificações de lembrete
        </Button.Root>
      </div>
    </div>
  );
}

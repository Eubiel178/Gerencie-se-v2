"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components";

import styles from "./notifications-toggle.module.css";

type Status =
  | "checking"
  | "unsupported"
  | "not-configured"
  | "denied"
  | "subscribed"
  | "unsubscribed";

// A chave VAPID pública não é segredo (é o próprio propósito do par de
// chaves - identificar o servidor pro navegador, nunca autenticar nada) -
// por isso pode ser lida direto de uma env `NEXT_PUBLIC_*` no cliente,
// sem precisar de uma rota de API só pra entregá-la.
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from(rawData, (char) => char.charCodeAt(0));
}

/**
 * Notificação push de verdade (Web Push) - chega mesmo com o navegador
 * fechado, ao contrário de `NotificationsToggle` (que só funciona com o
 * Gerencie-se aberto numa aba). As duas convivem de propósito: esta é
 * opcional e por cima da outra, nunca a substitui sozinha.
 */
export function PushToggle() {
  const [status, setStatus] = useState<Status>("checking");
  // Separado de `status` de propósito: ativar/desativar espera o
  // navegador (prompt de permissão + `subscribe`/`unsubscribe`, que pode
  // levar um instante) - manter o `status` intacto enquanto isso deixa o
  // botão certo visível com `loading`, em vez de o componente inteiro
  // sumir (`return null`) no meio do clique, que parecia um bug (achado
  // numa auditoria de estados de carregamento).
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function checkStatus() {
      if (!VAPID_PUBLIC_KEY) {
        setStatus("not-configured");
        return;
      }
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        setStatus("unsupported");
        return;
      }
      if (Notification.permission === "denied") {
        setStatus("denied");
        return;
      }

      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        if (!cancelled) setStatus(subscription ? "subscribed" : "unsubscribed");
      } catch {
        if (!cancelled) setStatus("unsupported");
      }
    }

    checkStatus();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleEnable() {
    if (!VAPID_PUBLIC_KEY) return;
    setIsBusy(true);

    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus(permission === "denied" ? "denied" : "unsubscribed");
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
      });

      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription.toJSON()),
      });

      setStatus("subscribed");
    } catch {
      setStatus("unsubscribed");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleDisable() {
    setIsBusy(true);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
        await subscription.unsubscribe();
      }

      setStatus("unsubscribed");
    } catch {
      setStatus("subscribed");
    } finally {
      setIsBusy(false);
    }
  }

  if (status === "checking") return null;

  if (status === "not-configured" || status === "unsupported") {
    return (
      <p className={styles.mutedText}>
        {status === "not-configured"
          ? "Notificação push não configurada neste servidor."
          : "Seu navegador não aceita notificações push."}
      </p>
    );
  }

  if (status === "denied") {
    return (
      <p className={styles.mutedText}>
        Notificações bloqueadas para este site. Para ativar, permita
        notificações do Gerencie-se nas configurações do seu navegador.
      </p>
    );
  }

  if (status === "subscribed") {
    return (
      <div className={styles.container}>
        <p className={styles.enabledMessage}>
          Notificações push ativadas neste aparelho.
        </p>

        <div className={styles.buttonRow}>
          <Button.Root
            type="button"
            variant="secondary"
            className={styles.smallButton}
            loading={isBusy}
            onClick={handleDisable}
          >
            Desativar neste aparelho
          </Button.Root>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <p className={styles.mutedText}>
        Receba um aviso mesmo com o app fechado. É só pra este aparelho —
        repita em qualquer outro que você use.
      </p>

      <div className={styles.buttonRow}>
        <Button.Root type="button" className={styles.smallButton} loading={isBusy} onClick={handleEnable}>
          Ativar notificações neste aparelho
        </Button.Root>
      </div>
    </div>
  );
}

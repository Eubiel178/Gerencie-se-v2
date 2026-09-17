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

      const response = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription.toJSON()),
      });

      if (!response.ok) {
        await subscription.unsubscribe();
        throw new Error("Não foi possível salvar a inscrição de notificações.");
      }

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
        const response = await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
        if (!response.ok) {
          throw new Error("Não foi possível desativar as notificações.");
        }
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
          ? "Os lembretes neste aparelho ainda não estão disponíveis."
          : "Este navegador não aceita lembretes mesmo com o app fechado."}
      </p>
    );
  }

  // Push usa a MESMA permissão do navegador que `NotificationsToggle`
  // (não existe uma permissão "só push" separada) - sem isso, os dois
  // ficavam bloqueados ao mesmo tempo e mostravam o aviso idêntico duas
  // vezes seguidas na tela (achado em auditoria visual: "parece bug").
  // `NotificationsToggle` já mostra o aviso (vem antes na seção
  // "Lembretes", ver `settings/index.tsx`) - aqui só omite a repetição.
  if (status === "denied") {
    return null;
  }

  if (status === "subscribed") {
    return (
      <div className={styles.container}>
        <p className={styles.enabledMessage}>
          Lembretes ativados neste aparelho, mesmo quando o app estiver fechado.
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
        Receba lembretes mesmo com o app fechado. É só pra este aparelho —
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

"use client";

import { useState } from "react";

import { Button, Feedback, Paragraph, Wrapper } from "@/components";

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
      <Paragraph size="small" color="secondary">
        Seu navegador não aceita notificações.
      </Paragraph>
    );
  }

  if (permission === "granted") {
    return (
      <Feedback type="success" size="small">
        Notificações de lembrete ativadas.
      </Feedback>
    );
  }

  if (permission === "denied") {
    return (
      <Paragraph size="small" color="secondary">
        Notificações bloqueadas para este site. Para ativar, permita
        notificações do Gerencie-se nas configurações do seu navegador.
      </Paragraph>
    );
  }

  return (
    <Wrapper direction="column" gap="small">
      <Paragraph size="small" color="secondary">
        Ative para receber lembretes de tarefas enquanto o Gerencie-se
        estiver aberto no navegador — fechar o navegador cancela os
        lembretes pendentes, já que não há um servidor de notificações
        por trás disso.
      </Paragraph>

      <Wrapper>
        <Button type="button" size="small" onClick={handleEnable}>
          Ativar notificações de lembrete
        </Button>
      </Wrapper>
    </Wrapper>
  );
}

"use client";

import { useSyncExternalStore } from "react";

/**
 * Ponte pequena e de mão única entre o mascote (fora do Widget, ver
 * `mascot-pet/index.tsx`) e o Widget do Assistant — permite pedir "abra
 * e mande esta mensagem" a partir de FORA do componente do Widget (ex.:
 * clicar em "Me ajuda" numa oferta de ajuda espontânea do Companion),
 * sem duplicar a lógica de envio/timeout que já existe dentro do
 * próprio `Widget` (`sendToAssistant`). O Widget continua sendo o ÚNICO
 * lugar que efetivamente fala com o Assistant; isto só entrega a
 * mensagem a ele.
 *
 * NUNCA muta nenhuma tarefa sozinho — é literalmente "abrir o chat e
 * perguntar", a mesma coisa que aconteceria se a pessoa tivesse digitado
 * a mensagem ela mesma. A decisão do que fazer com a resposta continua
 * inteiramente do lado do usuário, dentro do chat normal.
 */
export interface WidgetSeedRequest {
  id: number;
  text: string;
  taskId: string | null;
}

let counter = 0;
let current: WidgetSeedRequest | null = null;
let listeners: Array<() => void> = [];

function emitChange() {
  for (const listener of listeners) listener();
}

function subscribe(callback: () => void) {
  listeners = [...listeners, callback];
  return () => {
    listeners = listeners.filter((l) => l !== callback);
  };
}

function getSnapshot(): WidgetSeedRequest | null {
  return current;
}

function getServerSnapshot(): WidgetSeedRequest | null {
  return null;
}

/** Pede ao Widget pra abrir e enviar `text` como se o usuário tivesse
 * digitado — `taskId` é o contexto REAL da tarefa que originou o pedido
 * (nunca a tarefa "atual" recalculada depois). */
export function requestWidgetOpenWithMessage(text: string, taskId: string | null): void {
  counter += 1;
  current = { id: counter, text, taskId };
  emitChange();
}

export function useWidgetSeedRequest(): WidgetSeedRequest | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

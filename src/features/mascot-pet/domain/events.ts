/**
 * Eventos da aplicação que o mascote pode reagir - hoje ninguém emite
 * nenhum deles de verdade (nenhuma integração foi criada ainda). Isso é
 * só a infraestrutura pra, no futuro, uma Server Action ou componente
 * qualquer chamar `emitMascotEvent(...)` sem precisar conhecer PixiJS
 * nem o componente do mascote.
 */
export type MascotEventType =
  | "task-completed"
  | "goal-completed"
  | "habit-completed"
  | "routine-completed"
  | "achievement-unlocked"
  | "hydration-logged"
  | "action-error"
  | "user-idle"
  | "execution-started"
  | "execution-distracted"
  | "execution-stuck"
  | "execution-step-done"
  | "execution-resumed"
  | "execution-completed";

/** Payload opcional - hoje só carrega `taskId`, usado pelo Companion de
 * Tarefas pra saber a QUAL tarefa um evento pertence sem precisar
 * adivinhar a partir da sessão de execução "atual" (errado pra eventos
 * que não são sobre a sessão rastreada, ex.: concluir uma tarefa pelo
 * checkbox sem nunca ter iniciado execução nela). Opcional/retrocompatível
 * de propósito: quem emite/assina sem payload continua funcionando
 * exatamente como antes. */
export interface MascotEventPayload {
  taskId?: string;
  /** Só usado por "task-completed": diferencia uma conclusão ACOMPANHADA
   * (já tem seu próprio "execution-completed" à parte) de uma "vitória
   * silenciosa" concluída sem nunca ter tido sessão de execução — ver
   * `quiet-win` em `use-tasks-companion.ts`. Calculado por quem emite
   * (sabe o estado da sessão NO MOMENTO do clique), nunca inferido depois
   * a partir do estado da store (que já pode ter mudado). */
  hadExecutionSession?: boolean;
}

type MascotEventListener = (type: MascotEventType, payload?: MascotEventPayload) => void;

const listeners = new Set<MascotEventListener>();

export function emitMascotEvent(type: MascotEventType, payload?: MascotEventPayload): void {
  listeners.forEach((listener) => listener(type, payload));
}

/** Retorna uma função de cancelamento - chamar no cleanup de quem assinou. */
export function subscribeMascotEvent(listener: MascotEventListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

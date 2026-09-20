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

type MascotEventListener = (type: MascotEventType) => void;

const listeners = new Set<MascotEventListener>();

export function emitMascotEvent(type: MascotEventType): void {
  listeners.forEach((listener) => listener(type));
}

/** Retorna uma função de cancelamento - chamar no cleanup de quem assinou. */
export function subscribeMascotEvent(listener: MascotEventListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

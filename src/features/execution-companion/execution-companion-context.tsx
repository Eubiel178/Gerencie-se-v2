"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
} from "react";

import {
  startTaskExecutionAction,
  pauseTaskExecutionAction,
  resumeTaskExecutionAction,
  completeExecutionSessionAction,
  abandonTaskExecutionAction,
  type StartTaskExecutionResult,
} from "@/features/execution-companion/actions";
import type { IExecutionSession } from "@/features/execution-companion/domain/types";
import { useExecutionCompanionStore } from "@/features/execution-companion/execution-companion-store";
import { emitMascotEvent } from "@/features/mascot-pet";
import type { ActionResult } from "@/types/action-result";

interface ExecutionCompanionContextValue {
  session: IExecutionSession | null;
  intention: { taskId: string } | null;

  startSession: (taskId: string) => Promise<StartTaskExecutionResult>;
  pauseSession: () => Promise<ActionResult>;
  resumeSession: () => Promise<ActionResult>;
  completeSession: () => Promise<ActionResult>;
  abandonSession: () => Promise<ActionResult>;
}

const ExecutionCompanionContext = createContext<ExecutionCompanionContextValue | null>(null);

export function ExecutionCompanionProvider({
  children,
  initialSession,
  initialIntention,
}: {
  children: React.ReactNode;
  initialSession: IExecutionSession | null;
  initialIntention: { taskId: string } | null;
}) {
  const store = useExecutionCompanionStore();
  const storeRef = useRef(store);
  const restoredRef = useRef(false);

  useEffect(() => {
    storeRef.current = store;
  });

  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;

    // `storeRef.current` (nunca `store` direto) - o objeto que `store`
    // aponta muda de referência a cada render (hook do Zustand sem
    // seletor), o que forçaria incluir `store` nas deps e reconsiderar
    // este efeito em todo render (inofensivo aqui, já que `restoredRef`
    // bloqueia reexecução, mas desnecessário) - o ref já é mantido em dia
    // pelo efeito logo acima, sem precisar entrar no array de deps.
    if (initialSession) {
      storeRef.current.setSession(initialSession);
      storeRef.current.setIntention(initialIntention);
    }
  }, [initialSession, initialIntention]);

  const startSession = useCallback(async (taskId: string) => {
    const s = storeRef.current;

    // Ação combinada: marca a tarefa como iniciada E cria/alterna a sessão
    // de execução num único round-trip (ver `startTaskExecutionAction`).
    const result = await startTaskExecutionAction({ taskId });

    if (result.error) {
      return { error: result.error };
    }

    if (result.session) {
      s.setSession(result.session);
      s.setIntention({ taskId });
      emitMascotEvent("execution-started", { taskId });
    }

    return {
      error: null,
      switched: result.switched,
      previousTaskId: result.previousTaskId,
      session: result.session,
      taskStartedAt: result.taskStartedAt,
      taskWorkStatus: result.taskWorkStatus,
      taskPausedAt: result.taskPausedAt,
    };
  }, []);

  const pauseSession = useCallback(async () => {
    const s = storeRef.current;
    const session = s.session;
    if (!session) return { error: "Nenhuma sessão ativa." };

    // `task.work_status` e `execution_session.status` são escritos juntos,
    // numa única transação no servidor - ver `pauseTaskExecutionAction`
    // pro motivo (evita a tarefa e a sessão discordarem por um instante).
    const result = await pauseTaskExecutionAction({ taskId: session.taskId, sessionId: session.id });
    if (!result.error) {
      const now = new Date();
      s.updateSession({ status: "paused", pausedAt: now, updatedAt: now });
      emitMascotEvent("execution-distracted", { taskId: session.taskId });
    }
    return result;
  }, []);

  const resumeSession = useCallback(async () => {
    const s = storeRef.current;
    const session = s.session;
    if (!session) return { error: "Nenhuma sessão encontrada." };

    const result = await resumeTaskExecutionAction({ taskId: session.taskId, sessionId: session.id });
    if (!result.error) {
      const now = new Date();
      s.updateSession({ status: "active", pausedAt: null, resumedAt: now, updatedAt: now });
      emitMascotEvent("execution-resumed", { taskId: session.taskId });
    }
    return result;
  }, []);

  const completeSession = useCallback(async () => {
    const s = storeRef.current;
    const session = s.session;
    if (!session) return { error: "Nenhuma sessão encontrada." };

    const result = await completeExecutionSessionAction({ sessionId: session.id });
    if (!result.error) {
      s.updateSession({ status: "completed", completedAt: new Date() });
      s.setIntention(null);
      emitMascotEvent("execution-completed", { taskId: session.taskId });
      s.reset();
    }
    return result;
  }, []);

  const abandonSession = useCallback(async () => {
    const s = storeRef.current;
    const session = s.session;
    if (!session) return { error: "Nenhuma sessão encontrada." };

    const result = await abandonTaskExecutionAction({ taskId: session.taskId, sessionId: session.id });
    if (!result.error) {
      s.reset();
    }
    return result;
  }, []);

  return (
    <ExecutionCompanionContext.Provider
      value={{
        session: store.session,
        intention: store.intention,
        startSession,
        pauseSession,
        resumeSession,
        completeSession,
        abandonSession,
      }}
    >
      {children}
    </ExecutionCompanionContext.Provider>
  );
}

export function useExecutionCompanion(): ExecutionCompanionContextValue {
  const context = useContext(ExecutionCompanionContext);
  if (!context) {
    throw new Error("useExecutionCompanion precisa ser usado dentro de um ExecutionCompanionProvider");
  }
  return context;
}

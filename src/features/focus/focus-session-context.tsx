"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

import {
  cancelFocusSessionAction,
  completeFocusSessionAction,
  extendFocusSessionAction,
  startFocusSessionAction,
} from "@/features/focus/actions";
import { IFocusSession } from "@/features/focus/domain";
import type { ActionResult } from "@/types/action-result";

interface StartParams {
  plannedDurationSeconds: number;
  taskId?: string | null;
}

export type FocusPendingAction = "start" | "complete" | "cancel" | `extend:${number}` | null;

interface FocusSessionContextValue {
  session: IFocusSession | null;
  remaining: number;
  isBusy: boolean;
  /** A ação em andamento, para que só o controle acionado mostre spinner. */
  pendingAction: FocusPendingAction;
  // Só preenchido logo depois de uma conclusão bem-sucedida (automática
  // OU manual) - quem precisa reagir a isso (ex.: `Timer` oferecendo
  // marcar a tarefa associada como concluída) lê e depois chama
  // `clearLastCompletion`, pra não reagir de novo à mesma conclusão se
  // o componente re-renderizar por outro motivo.
  lastCompletion: { xpEarned: number; taskId: string | null } | null;
  start: (params: StartParams) => Promise<ActionResult>;
  complete: () => Promise<ActionResult & { xpEarned?: number }>;
  cancel: () => Promise<ActionResult>;
  extend: (additionalSeconds: number) => Promise<ActionResult>;
  clearLastCompletion: () => void;
}

const FocusSessionContext = createContext<FocusSessionContextValue | null>(null);

function secondsRemaining(session: IFocusSession, now: number): number {
  const elapsed = Math.floor((now - session.startedAt.getTime()) / 1000);
  return Math.max(0, session.plannedDurationSeconds - elapsed);
}

interface FocusSessionProviderProps {
  initialSession: IFocusSession | null;
  userId: string;
  children: React.ReactNode;
}

/**
 * Dona única do relógio/estado da sessão de foco - montada uma vez no
 * layout persistente de `/home/*` (mesmo padrão do JARVIS/mascote), pra
 * o foco continuar visível e contando em QUALQUER página, não só em
 * `/home/focus` (pedido explícito). Tanto o painel completo (`Timer`,
 * na página de Foco) quanto o widget compacto (`FocusMiniWidget`, nas
 * outras páginas) consomem o MESMO estado via `useFocusSession` - nunca
 * dois relógios independentes rodando ao mesmo tempo (isso duplicaria a
 * conclusão automática quando os dois estivessem montados juntos, ex.:
 * usuário na própria página de Foco).
 */
export function FocusSessionProvider({ initialSession, userId, children }: FocusSessionProviderProps) {
  const [session, setSession] = useState(initialSession);
  // Nunca `Date.now()` aqui (achado da auditoria pré-deploy: risco real
  // de mismatch de hidratação) - o valor inicial do estado roda tanto no
  // servidor quanto no cliente (hidratação), em instantes DIFERENTES;
  // com uma sessão já em andamento ao carregar a página, os dois podem
  // cair em segundos diferentes e produzir um `remaining` divergente no
  // HTML do servidor vs. o primeiro render do cliente. Inicializa com a
  // duração planejada (valor puro, sem depender do relógio) - o efeito
  // de tick logo abaixo já corrige pro valor real na hora certa, sempre
  // do lado do cliente, sem nunca rodar durante a própria hidratação.
  const [remaining, setRemaining] = useState(() => initialSession?.plannedDurationSeconds ?? 0);
  const [isBusy, setIsBusy] = useState(false);
  const [pendingAction, setPendingAction] = useState<FocusPendingAction>(null);
  const [lastCompletion, setLastCompletion] = useState<{ xpEarned: number; taskId: string | null } | null>(null);

  // Evita completar a mesma sessão duas vezes se o relógio (chegou a
  // zero) e uma conclusão manual chegarem no mesmo instante.
  const isCompletingRef = useRef(false);

  useEffect(() => {
    if (!session) return;

    const tick = () => setRemaining(secondsRemaining(session, Date.now()));
    tick();

    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [session]);

  // Aviso nativo do navegador ao tentar fechar/recarregar a aba com uma
  // sessão em andamento - agora vale em QUALQUER página (antes só
  // funcionava dentro de `/home/focus`, já que o efeito morava lá).
  useEffect(() => {
    if (!session) return;

    function handleBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [session]);

  const complete = useCallback(async (): Promise<ActionResult & { xpEarned?: number }> => {
    if (!session || isCompletingRef.current) return { error: null };

    isCompletingRef.current = true;
    setIsBusy(true);
    setPendingAction("complete");

    try {
      const result = await completeFocusSessionAction({ id: session.id });

      if (result.error) return { error: result.error };

      // Só notifica se a aba estiver em segundo plano nesse instante -
      // se a pessoa está olhando a tela (independente de qual página),
      // o relógio/celebração já aparecem visualmente ali, notificação
      // seria redundante. Nunca pede permissão sozinho - só notifica se
      // já foi concedida antes (mesmo padrão do `ReminderScheduler` de
      // lembrete de tarefa).
      if (
        typeof document !== "undefined" &&
        document.hidden &&
        "Notification" in window &&
        Notification.permission === "granted"
      ) {
        new Notification("Foco concluído!", {
          body: result.xpEarned && result.xpEarned > 0 ? `+${result.xpEarned} XP` : "Sessão de foco encerrada.",
          tag: `focus-session-${session.id}`,
        });
      }

      setLastCompletion({ xpEarned: result.xpEarned ?? 0, taskId: session.taskId ?? null });
      setSession(null);
      return { error: null, xpEarned: result.xpEarned };
    } finally {
      setIsBusy(false);
      setPendingAction(null);
      isCompletingRef.current = false;
    }
  }, [session]);

  // Única autoridade que decide "o tempo acabou" - antes esse efeito
  // morava dentro do `Timer` da página de Foco; se o widget compacto
  // tivesse um efeito equivalente próprio, os dois disparariam
  // `complete()` ao mesmo tempo sempre que a pessoa estivesse na própria
  // página de Foco (widget escondido lá, mas ainda montado no layout).
  useEffect(() => {
    if (session && remaining === 0 && !isCompletingRef.current) {
      complete();
    }
  }, [remaining, session, complete]);

  const start = useCallback(
    async (params: StartParams): Promise<ActionResult> => {
      setIsBusy(true);
      setPendingAction("start");

      try {
        const result = await startFocusSessionAction(params);

        if (result.session) {
          setSession({
            id: result.session.id,
            userId,
            startedAt: result.session.startedAt,
            plannedDurationSeconds: result.session.plannedDurationSeconds,
            status: "running",
            xpEarned: 0,
            taskId: result.session.taskId,
          });
          // Sem isso, `remaining` continua com o valor da sessão
          // anterior (0, já que normalmente é assim que uma sessão
          // termina) até o efeito de tick rodar - e nesse intervalo, o
          // efeito de auto-completar (acima) vê `session` truthy +
          // `remaining === 0` e conclui a sessão na mesma hora, com
          // 0s/0 XP (bug real, confirmado batendo no banco). Definir os
          // dois no mesmo evento (React agrupa numa única renderização)
          // garante que a sessão nasça com o tempo real dela.
          setRemaining(result.session.plannedDurationSeconds);
        }

        return { error: result.error };
      } finally {
        setIsBusy(false);
        setPendingAction(null);
      }
    },
    [userId]
  );

  const cancel = useCallback(async (): Promise<ActionResult> => {
    if (!session) return { error: null };

    setIsBusy(true);
    setPendingAction("cancel");

    try {
      const result = await cancelFocusSessionAction({ id: session.id });

      if (!result.error) {
        setSession(null);
      }

      return { error: result.error };
    } finally {
      setIsBusy(false);
      setPendingAction(null);
    }
  }, [session]);

  const extend = useCallback(
    async (additionalSeconds: number): Promise<ActionResult> => {
      if (!session) return { error: null };

      setIsBusy(true);
      setPendingAction(`extend:${additionalSeconds}`);

      try {
        const result = await extendFocusSessionAction({ id: session.id, additionalSeconds });

        if (result.error) return { error: result.error };

        setSession((current) =>
          current
            ? { ...current, plannedDurationSeconds: result.plannedDurationSeconds ?? current.plannedDurationSeconds }
            : current
        );

        return { error: null };
      } finally {
        setIsBusy(false);
        setPendingAction(null);
      }
    },
    [session]
  );

  const clearLastCompletion = useCallback(() => setLastCompletion(null), []);

  return (
    <FocusSessionContext.Provider
      value={{
        session,
        remaining,
        isBusy,
        pendingAction,
        lastCompletion,
        start,
        complete,
        cancel,
        extend,
        clearLastCompletion,
      }}
    >
      {children}
    </FocusSessionContext.Provider>
  );
}

export function useFocusSession(): FocusSessionContextValue {
  const context = useContext(FocusSessionContext);

  if (!context) {
    throw new Error("useFocusSession precisa ser usado dentro de um FocusSessionProvider");
  }

  return context;
}

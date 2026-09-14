"use client";

import { useEffect, useRef, useState } from "react";

import { useRouter } from "next/navigation";

import { Button, Modal, ModalHeader } from "@/components";

import {
  cancelFocusSessionAction,
  completeFocusSessionAction,
  startFocusSessionAction,
} from "@/features/focus/actions";
import { IFocusSession, IMascotState, MascotEvent } from "@/features/focus/domain";
import { toggleTaskCompleteAction } from "@/features/tasks/actions";
import { Mascot } from "../mascot";

import styles from "./timer.module.css";

const PRESETS_MINUTES = [15, 25, 50];

// Só o suficiente pra mostrar "Focando em: X" e oferecer marcar como
// concluída ao final - nunca o resto dos campos da tarefa (passos,
// recorrência etc.), que não fazem sentido aqui.
interface FocusTask {
  id: string;
  title: string;
  completed: boolean;
}

interface TimerProps {
  initialSession: IFocusSession | null;
  mascot: IMascotState;
  // Vem de `Focus` (ver `src/features/focus/index.tsx`) - já resolvida
  // no servidor a partir da sessão ativa ou do `?taskId=` da URL.
  task?: FocusTask | null;
}

function secondsRemaining(session: IFocusSession, now: number): number {
  const elapsed = Math.floor((now - session.startedAt.getTime()) / 1000);
  return Math.max(0, session.plannedDurationSeconds - elapsed);
}

function formatClock(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function Timer({ initialSession, mascot, task }: TimerProps) {
  const router = useRouter();

  const [session, setSession] = useState(initialSession);
  const [plannedMinutes, setPlannedMinutes] = useState(25);
  const [remaining, setRemaining] = useState(() =>
    initialSession ? secondsRemaining(initialSession, Date.now()) : 0
  );
  const [isBusy, setIsBusy] = useState(false);
  const [celebration, setCelebration] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [awayNudge, setAwayNudge] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  // Pergunta só depois de concluir uma sessão que tinha tarefa associada
  // e ainda não concluída - nunca reabre sozinha depois de fechada uma
  // vez (é sempre uma decisão pontual daquele momento).
  const [showTaskCompleteConfirm, setShowTaskCompleteConfirm] = useState(false);
  const [isMarkingTaskComplete, setIsMarkingTaskComplete] = useState(false);

  // Evita completar a mesma sessão duas vezes se o relógio e um clique em
  // "Concluir agora" chegarem no mesmo instante.
  const isCompletingRef = useRef(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const hiddenAtRef = useRef<number | null>(null);

  useEffect(() => {
    if (!session) return;

    const tick = () => setRemaining(secondsRemaining(session, Date.now()));
    tick();

    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [session]);

  // Bloqueio de distração real que um app web consegue oferecer (ver item
  // 26 do plano): nunca é possível impedir o usuário de trocar de aba ou
  // fechar o navegador de verdade — só avisar/lembrar. Três coisas, todas
  // dentro do que a plataforma web permite:
  // 1. Aviso nativo do navegador ao tentar fechar/recarregar a aba com uma
  //    sessão em andamento (beforeunload).
  useEffect(() => {
    if (!session) return;

    function handleBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [session]);

  // 2. Lembrete gentil (não punitivo) de quanto tempo a aba ficou em
  //    segundo plano durante a sessão, ao voltar pra ela.
  useEffect(() => {
    if (!session) return;

    function handleVisibilityChange() {
      if (document.hidden) {
        hiddenAtRef.current = Date.now();
        return;
      }

      if (hiddenAtRef.current === null) return;

      const awaySeconds = Math.round((Date.now() - hiddenAtRef.current) / 1000);
      hiddenAtRef.current = null;

      if (awaySeconds >= 5) {
        setAwayNudge(`Bem-vindo de volta — você saiu do foco por ${awaySeconds}s.`);
        setTimeout(() => setAwayNudge(null), 5000);
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [session]);

  // 3. Modo tela cheia opcional, reduz a visibilidade de outras abas/UI do
  //    sistema operacional enquanto a sessão está ativa.
  useEffect(() => {
    function handleFullscreenChange() {
      setIsFullscreen(document.fullscreenElement === panelRef.current);
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  async function handleToggleFullscreen() {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
      return;
    }

    await panelRef.current?.requestFullscreen().catch(() => {
      // Best-effort — alguns navegadores/contextos (ex.: iframe sem
      // allow="fullscreen") recusam; o timer continua funcionando normal.
    });
  }

  useEffect(() => {
    if (session && remaining === 0 && !isCompletingRef.current) {
      handleComplete();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining, session]);

  async function handleStart() {
    setIsBusy(true);

    try {
      const result = await startFocusSessionAction({
        plannedDurationSeconds: plannedMinutes * 60,
        taskId: task?.id ?? null,
      });

      if (result.session) {
        setSession({
          id: result.session.id,
          userId: mascot.userId,
          startedAt: result.session.startedAt,
          plannedDurationSeconds: result.session.plannedDurationSeconds,
          status: "running",
          xpEarned: 0,
          taskId: result.session.taskId,
        });
        // Sem isso, `remaining` continua com o valor da sessão anterior
        // (0, já que normalmente é assim que uma sessão termina) até o
        // efeito de tick rodar - e nesse intervalo, o efeito de
        // auto-completar (que reage a `[remaining, session]`) roda
        // primeiro, vê `session` truthy + `remaining === 0` e conclui a
        // sessão na mesma hora, com 0s/0 XP (bug real, confirmado batendo
        // no banco: várias sessões de 1500s planejados terminando em 0s).
        // Definir os dois no mesmo evento (React agrupa numa única
        // renderização) garante que a sessão nasça com o tempo real dela.
        setRemaining(result.session.plannedDurationSeconds);
      }
    } finally {
      setIsBusy(false);
    }
  }

  async function handleComplete() {
    if (!session || isCompletingRef.current) return;
    isCompletingRef.current = true;
    setIsBusy(true);
    setActionError(null);

    try {
      const result = await completeFocusSessionAction({ id: session.id });

      if (result.error) {
        setActionError(result.error);
        return;
      }

      setSession(null);
      setCelebration(
        result.xpEarned && result.xpEarned > 0
          ? `Foco concluído! +${result.xpEarned} XP`
          : "Foco concluído!"
      );

      // Só pergunta se a sessão que terminou tinha mesmo essa tarefa
      // associada (não a tarefa "atual" por acaso — `task` só existe
      // aqui quando `session.taskId` bate com ela, ver `Focus`) e ela
      // ainda não estava concluída.
      if (task && !task.completed) {
        setShowTaskCompleteConfirm(true);
      }

      setTimeout(() => setCelebration(null), 4000);
      router.refresh();
    } finally {
      setIsBusy(false);
      isCompletingRef.current = false;
    }
  }

  async function handleConfirmTaskComplete() {
    if (!task) return;

    setIsMarkingTaskComplete(true);
    try {
      await toggleTaskCompleteAction({ id: task.id });
      router.refresh();
    } finally {
      setIsMarkingTaskComplete(false);
      setShowTaskCompleteConfirm(false);
    }
  }

  async function handleCancel() {
    if (!session) return;
    setIsBusy(true);
    setActionError(null);

    try {
      const result = await cancelFocusSessionAction({ id: session.id });

      if (result.error) {
        setActionError(result.error);
        return;
      }

      setSession(null);
      router.refresh();
    } finally {
      setIsBusy(false);
    }
  }

  const mood: MascotEvent = celebration ? "happy" : session ? "working" : "idle";

  return (
    <div ref={panelRef} className={styles.panel} data-fullscreen={isFullscreen}>
      {session && (
        <Button.Preset
          icon={{ name: isFullscreen ? "MdFullscreenExit" : "MdFullscreen" }}
          root={{
            className: styles.fullscreenToggle,
            "aria-label": isFullscreen ? "Sair da tela cheia" : "Modo foco em tela cheia",
            onClick: handleToggleFullscreen,
          }}
        />
      )}

      <Mascot mascot={mascot} mood={mood} />

      {task && <p className={styles.taskBadge}>Focando em: {task.title}</p>}

      {celebration && <p className={styles.celebrationMessage}>{celebration}</p>}
      {actionError && <p className={styles.errorMessage}>{actionError}</p>}
      {awayNudge && <p className={styles.awayNudgeMessage}>{awayNudge}</p>}

      {session ? (
        <>
          <span className={styles.clock}>{formatClock(remaining)}</span>

          <div className={styles.controls}>
            <Button.Root variant="secondary" loading={isBusy} onClick={handleComplete}>
              Concluir agora
            </Button.Root>
            <Button.Root
              variant="secondary"
              tone="danger"
              loading={isBusy}
              onClick={handleCancel}
            >
              Cancelar
            </Button.Root>
          </div>
        </>
      ) : (
        <>
          <div className={styles.presets}>
            {PRESETS_MINUTES.map((minutes) => (
              <Button.Root
                key={minutes}
                type="button"
                variant={plannedMinutes === minutes ? "primary" : "secondary"}
                onClick={() => setPlannedMinutes(minutes)}
              >
                {minutes} min
              </Button.Root>
            ))}
          </div>

          <Button.Root data-tour="focus-start" loading={isBusy} onClick={handleStart}>
            Iniciar Foco ({plannedMinutes} min)
          </Button.Root>
        </>
      )}

      {showTaskCompleteConfirm && task && (
        <Modal onClose={() => setShowTaskCompleteConfirm(false)}>
          <ModalHeader
            title="Marcar tarefa como concluída?"
            onClose={() => setShowTaskCompleteConfirm(false)}
          />

          <p className={styles.taskCompleteText}>{task.title}</p>

          <div className={styles.taskCompleteActions}>
            <Button.Root
              type="button"
              variant="secondary"
              onClick={() => setShowTaskCompleteConfirm(false)}
            >
              Agora não
            </Button.Root>
            <Button.Root
              type="button"
              loading={isMarkingTaskComplete}
              onClick={handleConfirmTaskComplete}
            >
              Marcar como concluída
            </Button.Root>
          </div>
        </Modal>
      )}
    </div>
  );
}

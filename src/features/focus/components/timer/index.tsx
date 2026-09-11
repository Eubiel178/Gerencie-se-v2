"use client";

import { useEffect, useRef, useState } from "react";
import { MdFullscreen, MdFullscreenExit } from "react-icons/md";

import { useRouter } from "next/navigation";

import { Button } from "@/components";

import {
  cancelFocusSessionAction,
  completeFocusSessionAction,
  startFocusSessionAction,
} from "@/features/focus/actions";
import { IFocusSession, IMascotState } from "@/features/focus/domain";
import { Mascot, MascotMood } from "../mascot";

import styles from "./timer.module.css";

const PRESETS_MINUTES = [15, 25, 50];

interface TimerProps {
  initialSession: IFocusSession | null;
  mascot: IMascotState;
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

export function Timer({ initialSession, mascot }: TimerProps) {
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
      });

      if (result.session) {
        setSession({
          id: result.session.id,
          userId: mascot.userId,
          startedAt: result.session.startedAt,
          plannedDurationSeconds: result.session.plannedDurationSeconds,
          status: "running",
          xpEarned: 0,
        });
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

      setTimeout(() => setCelebration(null), 4000);
      router.refresh();
    } finally {
      setIsBusy(false);
      isCompletingRef.current = false;
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

  const mood: MascotMood = celebration ? "happy" : session ? "working" : "idle";

  return (
    <div ref={panelRef} className={styles.panel} data-fullscreen={isFullscreen}>
      {session && (
        <Button
          type="button"
          className={styles.fullscreenToggle}
          aria-label={isFullscreen ? "Sair da tela cheia" : "Modo foco em tela cheia"}
          onClick={handleToggleFullscreen}
        >
          {isFullscreen ? <MdFullscreenExit /> : <MdFullscreen />}
        </Button>
      )}

      <Mascot mascot={mascot} mood={mood} />

      {celebration && <p className={styles.celebrationMessage}>{celebration}</p>}
      {actionError && <p className={styles.errorMessage}>{actionError}</p>}
      {awayNudge && <p className={styles.awayNudgeMessage}>{awayNudge}</p>}

      {session ? (
        <>
          <span className={styles.clock}>{formatClock(remaining)}</span>

          <div className={styles.controls}>
            <Button className={styles.secondaryButton} loading={isBusy} onClick={handleComplete}>
              Concluir agora
            </Button>
            <Button
              className={`${styles.secondaryButton} ${styles.dangerButton}`}
              loading={isBusy}
              onClick={handleCancel}
            >
              Cancelar
            </Button>
          </div>
        </>
      ) : (
        <>
          <div className={styles.presets}>
            {PRESETS_MINUTES.map((minutes) => (
              <Button
                key={minutes}
                type="button"
                className={plannedMinutes === minutes ? undefined : styles.secondaryButton}
                onClick={() => setPlannedMinutes(minutes)}
              >
                {minutes} min
              </Button>
            ))}
          </div>

          <Button loading={isBusy} onClick={handleStart}>
            Iniciar Foco ({plannedMinutes} min)
          </Button>
        </>
      )}
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";

import { useRouter } from "next/navigation";

import { Button, Feedback } from "@/components";

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

  // Evita completar a mesma sessão duas vezes se o relógio e um clique em
  // "Concluir agora" chegarem no mesmo instante.
  const isCompletingRef = useRef(false);

  useEffect(() => {
    if (!session) return;

    const tick = () => setRemaining(secondsRemaining(session, Date.now()));
    tick();

    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [session]);

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

    try {
      const result = await completeFocusSessionAction({ id: session.id });

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

    try {
      await cancelFocusSessionAction({ id: session.id });
      setSession(null);
      router.refresh();
    } finally {
      setIsBusy(false);
    }
  }

  const mood: MascotMood = celebration ? "happy" : session ? "working" : "idle";

  return (
    <div className={styles.panel}>
      <Mascot mascot={mascot} mood={mood} />

      {celebration && <Feedback type="success">{celebration}</Feedback>}

      {session ? (
        <>
          <span className={styles.clock}>{formatClock(remaining)}</span>

          <div className={styles.controls}>
            <Button background="secondary" loading={isBusy} onClick={handleComplete}>
              Concluir agora
            </Button>
            <Button color="danger" background="secondary" loading={isBusy} onClick={handleCancel}>
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
                background={plannedMinutes === minutes ? "primary" : "secondary"}
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

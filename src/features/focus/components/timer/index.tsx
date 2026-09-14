"use client";

import { useEffect, useRef, useState } from "react";

import { useRouter } from "next/navigation";

import { Button, Modal, ModalHeader } from "@/components";

import { IMascotState, MascotEvent } from "@/features/focus/domain";
import { useFocusSession } from "@/features/focus/focus-session-context";
import { formatClock } from "@/features/focus/format-clock";
import { EXTEND_PRESETS_MINUTES } from "@/features/focus/extend-presets";
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
  mascot: IMascotState;
  // Vem de `Focus` (ver `src/features/focus/index.tsx`) - já resolvida
  // no servidor a partir da sessão ativa ou do `?taskId=` da URL.
  task?: FocusTask | null;
}

/**
 * Painel completo do foco (`/home/focus`) - o relógio/estado em si mora
 * em `FocusSessionProvider` (montado no layout, único pra qualquer
 * página), aqui só consome via `useFocusSession`. Sem isso, duas fontes
 * de verdade (esta página + `FocusMiniWidget`) disputariam quem conclui
 * a sessão quando o tempo acaba - ver comentário completo no provider.
 */
export function Timer({ mascot, task }: TimerProps) {
  const router = useRouter();
  const { session, remaining, isBusy, lastCompletion, start, complete, cancel, extend, clearLastCompletion } =
    useFocusSession();

  const [plannedMinutes, setPlannedMinutes] = useState(25);
  const [celebration, setCelebration] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [awayNudge, setAwayNudge] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  // Pergunta só depois de concluir uma sessão que tinha tarefa associada
  // e ainda não concluída - nunca reabre sozinha depois de fechada uma
  // vez (é sempre uma decisão pontual daquele momento).
  const [showTaskCompleteConfirm, setShowTaskCompleteConfirm] = useState(false);
  const [isMarkingTaskComplete, setIsMarkingTaskComplete] = useState(false);

  const panelRef = useRef<HTMLDivElement>(null);
  const hiddenAtRef = useRef<number | null>(null);

  // Reage a uma conclusão (automática OU manual, de QUALQUER página -
  // ver provider) assim que ela existir: mostra a celebração e, se a
  // sessão tinha a tarefa atual associada e ela ainda não tava
  // concluída, oferece marcar como concluída. Ajuste do estado LOCAL
  // durante a renderização (não em `useEffect`), padrão recomendado pra
  // "reagir a uma mudança vinda de fora" sem o re-render em cascata que
  // um efeito chamando `setState` causaria - `useState` (não `useRef`:
  // ref não pode ser lido/alterado durante a renderização) guarda a
  // última conclusão já tratada, pra não repetir pra a MESMA conclusão
  // em renders seguintes.
  const [handledCompletion, setHandledCompletion] = useState<typeof lastCompletion>(null);
  if (lastCompletion && lastCompletion !== handledCompletion) {
    setHandledCompletion(lastCompletion);

    setCelebration(
      lastCompletion.xpEarned > 0 ? `Foco concluído! +${lastCompletion.xpEarned} XP` : "Foco concluído!"
    );

    if (task && lastCompletion.taskId === task.id && !task.completed) {
      setShowTaskCompleteConfirm(true);
    }
  }

  // Consumir o sinal no provider (`clearLastCompletion`) É um efeito de
  // verdade - muda o estado de OUTRO componente (o provider), o que o
  // React não permite fazer direto durante a própria renderização deste
  // aqui. Sem isso, sair e voltar pra esta página reapresentaria a
  // mesma celebração/pergunta de novo.
  useEffect(() => {
    if (lastCompletion) clearLastCompletion();
  }, [lastCompletion, clearLastCompletion]);

  // A celebração se apaga sozinha depois de um tempo - efeito de
  // verdade também (sincroniza com um timer externo), só dispara de
  // novo quando `celebration` muda pra um texto novo.
  useEffect(() => {
    if (!celebration) return;
    const timeout = setTimeout(() => setCelebration(null), 4000);
    return () => clearTimeout(timeout);
  }, [celebration]);

  // Lembrete gentil (não punitivo) de quanto tempo a aba ficou em
  // segundo plano durante a sessão, ao voltar pra ela - só faz sentido
  // como decoração desta página específica (o aviso de fechar/recarregar
  // a aba, que precisa valer em qualquer página, mora no provider).
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

  // Modo tela cheia opcional, reduz a visibilidade de outras abas/UI do
  // sistema operacional enquanto a sessão está ativa.
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

  async function handleStart() {
    setActionError(null);
    const result = await start({ plannedDurationSeconds: plannedMinutes * 60, taskId: task?.id ?? null });
    if (result.error) setActionError(result.error);
  }

  async function handleComplete() {
    setActionError(null);
    const result = await complete();
    if (result.error) setActionError(result.error);
  }

  async function handleCancel() {
    setActionError(null);
    const result = await cancel();
    if (result.error) setActionError(result.error);
  }

  async function handleExtend(minutes: number) {
    setActionError(null);
    const result = await extend(minutes * 60);
    if (result.error) setActionError(result.error);
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

          <div className={styles.extendRow}>
            {EXTEND_PRESETS_MINUTES.map((minutes) => (
              <Button.Root
                key={minutes}
                type="button"
                variant="secondary"
                disabled={isBusy}
                onClick={() => handleExtend(minutes)}
              >
                +{minutes} min
              </Button.Root>
            ))}
          </div>

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

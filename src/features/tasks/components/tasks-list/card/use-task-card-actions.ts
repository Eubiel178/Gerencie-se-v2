"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { useExecutionCompanionStore, useExecutionCompanion } from "@/features/execution-companion";
import { useFocusSession } from "@/features/focus/focus-session-context";
import { emitMascotEvent } from "@/features/mascot-pet";
import {
  deleteTaskAction,
  markTaskStartedAction,
  setTaskWorkStatusAction,
  toggleTaskCompleteAction,
  updateTaskStepAction,
} from "@/features/tasks/actions";
import { ITask } from "@/features/tasks/domain";
import { useTaskStore } from "@/features/tasks/task-store";

type ActiveAction = "removing" | "toggling" | "starting" | "updatingWorkStatus" | null;

export function useTaskMutations(task: ITask) {
  const router = useRouter();
  const [activeAction, setActiveAction] = useState<ActiveAction>(null);
  const [busyStepId, setBusyStepId] = useState<string | null>(null);
  const removeTask = useTaskStore((state) => state.removeTask);
  const replaceTask = useTaskStore((state) => state.replaceTask);
  const { session: focusSession, remaining } = useFocusSession();
  const executionSession = useExecutionCompanionStore((s) => s.session);
  const { startSession, pauseSession, resumeSession, completeSession, abandonSession } = useExecutionCompanion();

  const isExecuting =
    executionSession?.taskId === task.id && executionSession.status === "active";

  // `resumedAt` marca o início do trecho de execução ATUAL (igual a
  // `startedAt` na criação, atualizado de novo a cada resume) - usamos
  // como "desde quando essa execução está rodando" pra mostrar "Fazendo
  // agora · X min" sem depender do timer do Foco/Pomodoro (feature
  // separada, pode nem estar ativo pra essa tarefa) nem de `updatedAt`
  // (que também muda ao marcar um passo, o que reiniciaria o contador
  // sem o usuário ter pausado/retomado nada).
  const [executingTick, setExecutingTick] = useState(() => Date.now());
  useEffect(() => {
    if (!isExecuting) return;
    const interval = setInterval(() => setExecutingTick(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [isExecuting]);

  const executingElapsedSeconds =
    isExecuting && executionSession
      ? Math.max(
          0,
          Math.floor((executingTick - executionSession.resumedAt.getTime()) / 1000)
        )
      : 0;

  async function handleTaskRemove() {
    setActiveAction("removing");
    try {
      const result = await deleteTaskAction({ id: task.id });
      if (result.error) {
        emitMascotEvent("action-error");
      } else {
        removeTask(task.id);
      }
    } finally {
      setActiveAction(null);
    }
  }

  async function handleToggleComplete() {
    setActiveAction("toggling");
    try {
      const result = await toggleTaskCompleteAction({ id: task.id });
      if (result.error) {
        emitMascotEvent("action-error");
      } else if (result.completed) {
        // Completa a sessão de execução se existir
        if (executionSession?.taskId === task.id && executionSession.status === "active") {
          await completeSession();
        }
      }
      if (!result.error)
        replaceTask({
          ...task,
          completed: !!result.completed,
          completedAt: result.completed ? new Date() : null,
        });
    } finally {
      setActiveAction(null);
    }
  }

  async function handleMarkStarted() {
    if (activeAction === "starting") return;
    setActiveAction("starting");
    try {
      const result = await markTaskStartedAction({ id: task.id });
      if (!result.error) {
        replaceTask({ ...task, startedAt: task.startedAt ?? new Date() });
        // Inicia ou faz switch da sessão de execução
        const switchResult = await startSession(task.id);
        // Se houve switch, atualiza a task antiga no store
        if (switchResult.switched && switchResult.previousTaskId) {
          const tasks = useTaskStore.getState().tasks;
          const oldTask = tasks.find((t) => t.id === switchResult.previousTaskId);
          if (oldTask) {
            replaceTask({ ...oldTask, workStatus: "paused" });
          }
        }
      }
    } finally {
      setActiveAction(null);
    }
  }

  async function handleWorkStatus(
    nextStatus: "pending" | "in_progress" | "paused",
  ) {
    if (activeAction === "updatingWorkStatus") return;
    setActiveAction("updatingWorkStatus");
    try {
      const result = await setTaskWorkStatusAction({
        id: task.id,
        workStatus: nextStatus,
      });
      if (!result.error) {
        replaceTask({ ...task, workStatus: nextStatus });

        if (executionSession?.taskId === task.id) {
          if (nextStatus === "paused") {
            await pauseSession();
          } else if (nextStatus === "in_progress") {
            await resumeSession();
          } else if (nextStatus === "pending") {
            await abandonSession();
          }
        }
      }
    } finally {
      setActiveAction(null);
    }
  }

  async function handleToggleStep(stepId: string, completed: boolean) {
    if (busyStepId) return;
    setBusyStepId(stepId);
    try {
      const result = await updateTaskStepAction({ id: stepId, completed });
      if (!result.error) {
        replaceTask({
          ...task,
          steps: task.steps.map((step) =>
            step.id === stepId ? { ...step, completed } : step,
          ),
        });
      }
    } finally {
      setBusyStepId(null);
    }
  }

  return {
    router,
    isRemoving: activeAction === "removing",
    isToggling: activeAction === "toggling",
    isStarting: activeAction === "starting",
    isUpdatingWorkStatus: activeAction === "updatingWorkStatus",
    busyStepId,
    focusSession,
    remaining,
    executionSession,
    isExecuting,
    executingElapsedSeconds,
    handleTaskRemove,
    handleToggleComplete,
    handleMarkStarted,
    handleWorkStatus,
    handleToggleStep,
  };
}

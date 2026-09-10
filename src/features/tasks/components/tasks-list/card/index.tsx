"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { FaTrash, FaSyncAlt, FaCheck, FaRedo } from "react-icons/fa";

import {
  deleteTaskAction,
  retryTaskSyncAction,
  toggleTaskCompleteAction,
} from "@/features/tasks/actions";

import { Button, Feedback, Paragraph, Wrapper } from "@/components";
import { EditTask } from "../../modal";
import { PRIORITY_LABELS } from "../../modal/interfaces";

import { ITask } from "@/features/tasks/domain";

import styles from "../../../home-dashboard.module.css";
import { useTaskStore } from "@/features/tasks/task-store";

const HIGH_PRIORITY_FEEDBACK_TYPE = {
  critica: "error",
  alta: "warning",
} as const;

interface CardProps {
  task: ITask;
  // Rótulo de exibição da tag (ex.: "#Estudo") — mantido separado de
  // `task.tag` (que continua sendo o valor real, ex.: "studie") para que o
  // formulário de edição sempre receba a tarefa original, nunca a versão
  // formatada só para exibição.
  tagLabel: string;
  isGoogleConnected: boolean;
}

export function Card({ task, tagLabel, isGoogleConnected }: CardProps) {
  const router = useRouter();
  const [isRemoving, setIsRemoving] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const removeTask = useTaskStore((state) => state.removeTask);

  async function handleTaskRemove() {
    setIsRemoving(true);

    try {
      const result = await deleteTaskAction({ id: task.id });
      if (!result.error) removeTask(task.id);
      router.refresh();
    } finally {
      setIsRemoving(false);
    }
  }

  async function handleToggleComplete() {
    setIsToggling(true);

    try {
      await toggleTaskCompleteAction({ id: task.id });
      router.refresh();
    } finally {
      setIsToggling(false);
    }
  }

  async function handleRetrySync() {
    setIsRetrying(true);

    try {
      await retryTaskSyncAction({ id: task.id });
      router.refresh();
    } finally {
      setIsRetrying(false);
    }
  }

  return (
    <li key={task.id} className={styles.taskCard}>
      <Wrapper align="start" background="dark" className={styles.taskCardHeader}>
        <Wrapper flex="flex1" justify="between" align="center" padding="small">
          <Wrapper gap="small" align="center">
            <button
              type="button"
              className={styles.completeCheckbox}
              data-checked={task.completed}
              aria-pressed={task.completed}
              aria-label={`Marcar tarefa "${task.title}" como ${task.completed ? "não concluída" : "concluída"}`}
              disabled={isToggling}
              onClick={handleToggleComplete}
            >
              {task.completed && <FaCheck aria-hidden="true" />}
            </button>

            <Paragraph color="highlight" size="small">
              {tagLabel}
            </Paragraph>
          </Wrapper>

          <Wrapper gap="medium">
            <Button
              color="danger"
              background="transparent"
              size="xlarge"
              aria-label={`Excluir tarefa ${task.title}`}
              loading={isRemoving}
              onClick={handleTaskRemove}
            >
              <FaTrash />
            </Button>

            <EditTask taskBeingEdited={task} isGoogleConnected={isGoogleConnected} />
          </Wrapper>
        </Wrapper>
      </Wrapper>

      <Wrapper
        direction="column"
        justify="between"
        flex="flex1"
        padding="medium"
      >
        <Wrapper direction="column" gap="medium">
          <Wrapper justify="between" align="center">
            <Wrapper gap="small" align="center">
              <h3
                className={styles.taskTitle}
                data-completed={task.completed}
              >
                {task.title}
              </h3>

              {task.recurrence !== "none" && (
                <FaRedo
                  role="img"
                  aria-label={
                    task.recurrence === "daily" ? "Repete diariamente" : "Repete semanalmente"
                  }
                  title={task.recurrence === "daily" ? "Repete diariamente" : "Repete semanalmente"}
                  size={12}
                  color="var(--color-text-muted)"
                />
              )}
            </Wrapper>

            {(task.priority === "critica" || task.priority === "alta") && (
              <Feedback type={HIGH_PRIORITY_FEEDBACK_TYPE[task.priority]} size="xSmall">
                {PRIORITY_LABELS[task.priority]}
              </Feedback>
            )}
          </Wrapper>

          <Paragraph color="secondary" size="small">
            {task.description}
          </Paragraph>
        </Wrapper>

        {task.syncEnabled && (
          <Wrapper direction="column" gap="small">
            {task.syncStatus === "SYNCED" && (
              <Feedback type="success" size="xSmall">
                Sincronizado com o Google Agenda
              </Feedback>
            )}

            {task.syncStatus === "ERROR" && (
              <>
                <Feedback type="error" size="xSmall">
                  {task.syncError || "Falha ao sincronizar com o Google Agenda."}
                </Feedback>

                <Button
                  type="button"
                  size="xsmall"
                  background="secondary"
                  loading={isRetrying}
                  onClick={handleRetrySync}
                >
                  <Wrapper align="center" gap="xsmall" background="transparent">
                    <FaSyncAlt aria-hidden="true" />
                    <span>Tentar novamente</span>
                  </Wrapper>
                </Button>
              </>
            )}
          </Wrapper>
        )}
      </Wrapper>
    </li>
  );
}

"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { FaTrash, FaSyncAlt } from "react-icons/fa";

import { deleteTaskAction, retryTaskSyncAction } from "@/features/tasks/actions";

import { Button, Feedback, Paragraph, Wrapper } from "@/components";
import { EditTask } from "../../modal";

import { ITask } from "@/@core/domain";

import styles from "../../../home-dashboard.module.css";
import { useTaskStore } from "@/features/tasks/task-store";

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
          <Paragraph color="highlight" size="small">
            {tagLabel}
          </Paragraph>

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
          <h3 className={styles.taskTitle}>{task.title}</h3>

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

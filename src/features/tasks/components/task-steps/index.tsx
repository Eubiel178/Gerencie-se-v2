"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { Button, Input } from "@/components";

import {
  createTaskStepAction,
  deleteTaskStepAction,
  updateTaskStepAction,
} from "@/features/tasks/actions";
import { ITaskStep } from "@/features/tasks/domain";

import styles from "./task-steps.module.css";

interface TaskStepsProps {
  taskId: string;
  steps: ITaskStep[];
}

/**
 * "Quebrar em passos menores" (Modo Assistido) — checklist simples
 * dentro da tarefa. Nunca gerado sozinho (nunca inventa passos): só o
 * que o próprio usuário adicionar. Mesmo padrão de `goals-list/card`
 * (adicionar/marcar/remover um passo por vez).
 */
export function TaskSteps({ taskId, steps }: TaskStepsProps) {
  const router = useRouter();
  const [newStepTitle, setNewStepTitle] = useState("");
  const [isAddingStep, setIsAddingStep] = useState(false);
  const [busyStepId, setBusyStepId] = useState<string | null>(null);

  async function handleToggleStep(stepId: string, completed: boolean) {
    if (busyStepId) return;

    setBusyStepId(stepId);
    try {
      await updateTaskStepAction({ id: stepId, completed });
      router.refresh();
    } finally {
      setBusyStepId(null);
    }
  }

  async function handleRemoveStep(stepId: string) {
    if (busyStepId) return;

    setBusyStepId(stepId);
    try {
      await deleteTaskStepAction({ id: stepId });
      router.refresh();
    } finally {
      setBusyStepId(null);
    }
  }

  async function handleAddStep(event: React.FormEvent) {
    event.preventDefault();

    const title = newStepTitle.trim();
    if (!title) return;

    setIsAddingStep(true);

    try {
      await createTaskStepAction({ taskId, title });
      setNewStepTitle("");
      router.refresh();
    } finally {
      setIsAddingStep(false);
    }
  }

  return (
    <div className={styles.wrapper}>
      {steps.length > 0 && (
        <p className={styles.hint}>
          {steps.filter((step) => step.completed).length} de {steps.length} passos concluídos.
        </p>
      )}

      {steps.length > 0 && (
        <ul className={styles.steps}>
          {steps.map((step) => (
            <li key={step.id} className={styles.step}>
              <input
                type="checkbox"
                checked={step.completed}
                disabled={busyStepId === step.id}
                onChange={(event) => handleToggleStep(step.id, event.target.checked)}
                aria-label={step.title}
              />
              <span className={`${styles.stepTitle} ${step.completed ? styles.stepTitleDone : ""}`}>
                {step.title}
              </span>
              <Button.Preset
                icon={{ name: "FaTrash" }}
                root={{
                  tone: "danger",
                  className: styles.smallButton,
                  "aria-label": `Remover passo ${step.title}`,
                  loading: busyStepId === step.id,
                  onClick: () => handleRemoveStep(step.id),
                }}
              />
            </li>
          ))}
        </ul>
      )}

      <form className={styles.addStepForm} onSubmit={handleAddStep}>
        <Input.Field
          aria-label="Título do novo passo"
          placeholder="Adicionar um passo..."
          value={newStepTitle}
          onChange={(event) => setNewStepTitle(event.target.value)}
        />
        <Button.Root
          type="submit"
          variant="secondary"
          className={styles.smallButton}
          aria-label="Adicionar passo"
          loading={isAddingStep}
        >
          <Button.Icon name="FaPlus" />
        </Button.Root>
      </form>
    </div>
  );
}

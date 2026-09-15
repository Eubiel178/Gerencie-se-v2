"use client";

import { Button, ConfirmIconButton, Input } from "@/components";

import {
  createTaskStepAction,
  deleteTaskStepAction,
  updateTaskStepAction,
} from "@/features/tasks/actions";
import { ITaskStep } from "@/features/tasks/domain";
import { useStepChecklist } from "@/hooks/use-step-checklist";

import styles from "./task-steps.module.css";

interface TaskStepsProps {
  taskId: string;
  steps: ITaskStep[];
}

/**
 * "Quebrar em passos menores" (Modo Assistido) — checklist simples
 * dentro da tarefa. Nunca gerado sozinho (nunca inventa passos): só o
 * que o próprio usuário adicionar. Mesmo padrão de `goals-list/card`
 * (adicionar/marcar/remover um passo por vez) — a orquestração comum aos
 * dois mora em `useStepChecklist`.
 */
export function TaskSteps({ taskId, steps }: TaskStepsProps) {
  const {
    newTitle: newStepTitle,
    setNewTitle: setNewStepTitle,
    isAdding: isAddingStep,
    busyStepId,
    handleAddStep,
    handleToggleStep,
    handleRemoveStep,
  } = useStepChecklist({
    addStep: (title) => createTaskStepAction({ taskId, title }),
    toggleStep: (id, completed) => updateTaskStepAction({ id, completed }),
    removeStep: (id) => deleteTaskStepAction({ id }),
  });

  // Não é um <form>: este componente é sempre renderizado dentro do
  // form de edição da tarefa (`EditTask`) — HTML não permite <form>
  // aninhado (o navegador simplesmente ignora o de dentro, e o React
  // acusa erro de hidratação). Enter no campo e clique no botão levam
  // ao mesmo lugar: adicionar o passo, sem submeter o form de fora.
  function handleTitleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") return;

    // Impede que o Enter borbulhe e submeta o form de fora (o de editar
    // a tarefa) — aqui ele só deve adicionar o passo.
    event.preventDefault();
    handleAddStep();
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
              <ConfirmIconButton
                icon="FaTrash"
                ariaLabel={`Remover passo ${step.title}`}
                confirmText={`Remover o passo "${step.title}"?`}
                className={styles.smallButton}
                loading={busyStepId === step.id}
                onConfirm={() => handleRemoveStep(step.id)}
              />
            </li>
          ))}
        </ul>
      )}

      <div className={styles.addStepForm}>
        <Input.Field
          aria-label="Título do novo passo"
          placeholder="Adicionar um passo..."
          value={newStepTitle}
          onChange={(event) => setNewStepTitle(event.target.value)}
          onKeyDown={handleTitleKeyDown}
        />
        <Button.Root
          type="button"
          variant="secondary"
          className={styles.smallButton}
          aria-label="Adicionar passo"
          loading={isAddingStep}
          onClick={handleAddStep}
        >
          <Button.Icon name="FaPlus" />
        </Button.Root>
      </div>
    </div>
  );
}

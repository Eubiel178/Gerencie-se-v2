"use client";

import { Button, ConfirmIconButton, Input } from "@/components";
import { Icon } from "@/components/icon";

import {
  deleteTaskStepAction,
  reorderTaskStepsAction,
  updateTaskStepAction,
} from "@/features/tasks/actions";
import { ITaskStep } from "@/features/tasks/domain";
import { useState } from "react";

import styles from "./styles.module.css";

interface TaskStepsProps {
  taskId: string;
  steps: ITaskStep[];
  /** Novos passos ainda não são persistidos: o formulário-pai os salva
   * junto com as demais alterações da tarefa. */
  onPendingStepsChange: (titles: string[]) => void;
}

/**
 * "Quebrar em passos menores" (Modo Assistido) — checklist simples
 * dentro da tarefa. Nunca gerado sozinho (nunca inventa passos): só o
 * que o próprio usuário adicionar. Os novos passos ficam pendentes no
 * formulário até a pessoa salvar as alterações da tarefa.
 */
export function TaskSteps({ taskId, steps, onPendingStepsChange }: TaskStepsProps) {
  // O formulário de edição da tarefa não é desmontado ao salvar um passo.
  // Por isso os passos precisam de estado local próprio: depender somente do
  // `router.refresh()` mantinha a prop antiga visível dentro do modal.
  const [visibleSteps, setVisibleSteps] = useState(steps);
  const [newStepTitle, setNewStepTitle] = useState("");
  const [pendingSteps, setPendingSteps] = useState<{ id: string; title: string }[]>([]);
  const [busyStepId, setBusyStepId] = useState<string | null>(null);
  const [editingStepId, setEditingStepId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");

  function handleQueueStep() {
    const title = newStepTitle.trim();
    if (!title) return;

    setPendingSteps((current) => {
      const next = [...current, { id: crypto.randomUUID(), title }];
      onPendingStepsChange(next.map((step) => step.title));
      return next;
    });
    setNewStepTitle("");
  }

  function updatePendingStep(id: string, title: string) {
    setPendingSteps((current) => {
      const next = current.map((step) => step.id === id ? { ...step, title } : step);
      onPendingStepsChange(next.map((step) => step.title.trim()).filter(Boolean));
      return next;
    });
  }

  function removePendingStep(id: string) {
    setPendingSteps((current) => {
      const next = current.filter((step) => step.id !== id);
      onPendingStepsChange(next.map((step) => step.title));
      return next;
    });
  }

  async function handleToggleStep(id: string, completed: boolean) {
    if (busyStepId) return;

    setBusyStepId(id);
    try {
      const result = await updateTaskStepAction({ id, completed });
      if (!result.error) {
        setVisibleSteps((current) => current.map((step) => step.id === id ? { ...step, completed } : step));
      }
    } finally {
      setBusyStepId(null);
    }
  }

  async function handleSaveStepTitle(id: string) {
    const title = editingTitle.trim();
    if (!title || busyStepId) return;

    setBusyStepId(id);
    try {
      const result = await updateTaskStepAction({ id, title });
      if (!result.error) {
        setVisibleSteps((current) => current.map((step) => step.id === id ? { ...step, title } : step));
        setEditingStepId(null);
        setEditingTitle("");
      }
    } finally {
      setBusyStepId(null);
    }
  }

  async function handleRemoveStep(id: string) {
    if (busyStepId) return;

    setBusyStepId(id);
    try {
      const result = await deleteTaskStepAction({ id });
      if (!result.error) setVisibleSteps((current) => current.filter((step) => step.id !== id));
    } finally {
      setBusyStepId(null);
    }
  }

  async function handleMoveStep(id: string, direction: -1 | 1) {
    if (busyStepId) return;

    const currentIndex = visibleSteps.findIndex((step) => step.id === id);
    const nextIndex = currentIndex + direction;
    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= visibleSteps.length) return;

    const reordered = [...visibleSteps];
    [reordered[currentIndex], reordered[nextIndex]] = [reordered[nextIndex], reordered[currentIndex]];
    const orderedStepIds = reordered.map((step) => step.id);

    setBusyStepId(id);
    try {
      const result = await reorderTaskStepsAction({ taskId, orderedStepIds });
      if (!result.error) {
        setVisibleSteps(reordered.map((step, order) => ({ ...step, order })));
      }
    } finally {
      setBusyStepId(null);
    }
  }

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
    handleQueueStep();
  }

  return (
    <div className={styles.wrapper}>
      {visibleSteps.length > 0 && (
        <p className={styles.hint}>
          {visibleSteps.filter((step) => step.completed).length} de {visibleSteps.length} passos concluídos.
        </p>
      )}

      {pendingSteps.length > 0 && (
        <ul className={styles.steps} aria-label="Novos passos a salvar">
          {pendingSteps.map((step) => (
            <li key={step.id} className={styles.step}>
              <span className={styles.pendingMarker} aria-hidden="true">+</span>
              <input
                className={styles.editTitle}
                aria-label="Novo passo"
                value={step.title}
                onChange={(event) => updatePendingStep(step.id, event.target.value)}
              />
              <button type="button" className={styles.actionButton} onClick={() => removePendingStep(step.id)} aria-label={`Remover novo passo ${step.title}`}>
                <Icon name="FaTimes" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {visibleSteps.length > 0 && (
        <ul className={styles.steps}>
          {visibleSteps.map((step, index) => (
            <li key={step.id} className={styles.step}>
              <input
                type="checkbox"
                checked={step.completed}
                disabled={busyStepId === step.id}
                onChange={(event) => handleToggleStep(step.id, event.target.checked)}
                aria-label={step.title}
              />
              {editingStepId === step.id ? (
                <input
                  className={styles.editTitle}
                  aria-label={`Editar passo ${step.title}`}
                  value={editingTitle}
                  onChange={(event) => setEditingTitle(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      handleSaveStepTitle(step.id);
                    }
                    if (event.key === "Escape") setEditingStepId(null);
                  }}
                  autoFocus
                />
              ) : (
                <span className={`${styles.stepTitle} ${step.completed ? styles.stepTitleDone : ""}`}>
                  {step.title}
                </span>
              )}
              {editingStepId === step.id ? (
                <>
                  <button type="button" className={styles.actionButton} onClick={() => handleSaveStepTitle(step.id)} aria-label={`Salvar passo ${step.title}`} disabled={busyStepId === step.id}>
                    <Icon name="FaCheck" aria-hidden="true" />
                  </button>
                  <button type="button" className={styles.actionButton} onClick={() => setEditingStepId(null)} aria-label="Cancelar edição">
                    <Icon name="FaTimes" aria-hidden="true" />
                  </button>
                </>
              ) : (
                <button type="button" className={styles.actionButton} onClick={() => { setEditingStepId(step.id); setEditingTitle(step.title); }} aria-label={`Editar passo ${step.title}`}>
                  <Icon name="FaEdit" aria-hidden="true" />
                </button>
              )}
              <div className={styles.orderActions} aria-label={`Reordenar ${step.title}`}>
                <button type="button" className={styles.actionButton} onClick={() => handleMoveStep(step.id, -1)} aria-label={`Mover ${step.title} para cima`} disabled={index === 0 || busyStepId === step.id}>
                  <Icon name="FaChevronUp" aria-hidden="true" />
                </button>
                <button type="button" className={styles.actionButton} onClick={() => handleMoveStep(step.id, 1)} aria-label={`Mover ${step.title} para baixo`} disabled={index === visibleSteps.length - 1 || busyStepId === step.id}>
                  <Icon name="FaChevronDown" aria-hidden="true" />
                </button>
              </div>
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
          onClick={handleQueueStep}
        >
          <Button.Icon name="FaPlus" />
        </Button.Root>
      </div>
    </div>
  );
}

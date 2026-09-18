"use client";

import { useState } from "react";

import { Button, ConfirmIconButton, Input } from "@/components";
import { Icon } from "@/components/icon";
import { ITaskStep } from "@/features/tasks/domain";

import styles from "./styles.module.css";

export interface TaskStepsDraft {
  existingSteps: ITaskStep[];
  newStepTitles: string[];
}

interface TaskStepsProps {
  steps: ITaskStep[];
  onDraftChange: (draft: TaskStepsDraft) => void;
}

/** Mantém todos os passos como rascunho até o formulário principal salvar. */
export function TaskSteps({ steps, onDraftChange }: TaskStepsProps) {
  const [visibleSteps, setVisibleSteps] = useState(steps);
  const [newStepTitle, setNewStepTitle] = useState("");
  const [pendingSteps, setPendingSteps] = useState<{ id: string; title: string }[]>([]);
  const [editingStepId, setEditingStepId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const completedSteps = visibleSteps.filter((step) => step.completed).length;
  const totalSteps = visibleSteps.length + pendingSteps.length;

  function publish(nextExistingSteps: ITaskStep[], nextPendingSteps: { id: string; title: string }[]) {
    onDraftChange({
      existingSteps: nextExistingSteps,
      newStepTitles: nextPendingSteps.map((step) => step.title.trim()).filter(Boolean),
    });
  }

  function handleQueueStep() {
    const title = newStepTitle.trim();
    if (!title) return;
    const nextPendingSteps = [...pendingSteps, { id: crypto.randomUUID(), title }];
    setPendingSteps(nextPendingSteps);
    publish(visibleSteps, nextPendingSteps);
    setNewStepTitle("");
  }

  function updatePendingStep(id: string, title: string) {
    const nextPendingSteps = pendingSteps.map((step) => step.id === id ? { ...step, title } : step);
    setPendingSteps(nextPendingSteps);
    publish(visibleSteps, nextPendingSteps);
  }

  function removePendingStep(id: string) {
    const nextPendingSteps = pendingSteps.filter((step) => step.id !== id);
    setPendingSteps(nextPendingSteps);
    publish(visibleSteps, nextPendingSteps);
  }

  function handleToggleStep(id: string, completed: boolean) {
    const nextSteps = visibleSteps.map((step) => step.id === id ? { ...step, completed } : step);
    setVisibleSteps(nextSteps);
    publish(nextSteps, pendingSteps);
  }

  function handleSaveStepTitle(id: string) {
    const title = editingTitle.trim();
    if (!title) return;
    const nextSteps = visibleSteps.map((step) => step.id === id ? { ...step, title } : step);
    setVisibleSteps(nextSteps);
    publish(nextSteps, pendingSteps);
    setEditingStepId(null);
    setEditingTitle("");
  }

  function handleRemoveStep(id: string) {
    const nextSteps = visibleSteps.filter((step) => step.id !== id);
    setVisibleSteps(nextSteps);
    publish(nextSteps, pendingSteps);
  }

  function handleMoveStep(id: string, direction: -1 | 1) {
    const currentIndex = visibleSteps.findIndex((step) => step.id === id);
    const nextIndex = currentIndex + direction;
    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= visibleSteps.length) return;
    const nextSteps = [...visibleSteps];
    [nextSteps[currentIndex], nextSteps[nextIndex]] = [nextSteps[nextIndex], nextSteps[currentIndex]];
    const orderedSteps = nextSteps.map((step, order) => ({ ...step, order }));
    setVisibleSteps(orderedSteps);
    publish(orderedSteps, pendingSteps);
  }

  function handleTitleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") return;
    event.preventDefault();
    handleQueueStep();
  }

  return (
    <div className={styles.wrapper}>
      {totalSteps > 0 && <p className={styles.hint}>{completedSteps} de {totalSteps} passos concluídos.</p>}

      {pendingSteps.length > 0 && (
        <ul className={`${styles.steps} ${styles.pendingSteps}`} aria-label="Novos passos a salvar">
          {pendingSteps.map((step) => (
            <li key={step.id} className={styles.step}>
              <input type="checkbox" checked={false} readOnly aria-label={`Novo passo ${step.title}`} />
              <input className={styles.editTitle} aria-label="Novo passo" value={step.title} onChange={(event) => updatePendingStep(step.id, event.target.value)} />
              <button type="button" className={styles.actionButton} onClick={() => removePendingStep(step.id)} aria-label={`Remover novo passo ${step.title}`}><Icon name="FaTimes" aria-hidden="true" /></button>
            </li>
          ))}
        </ul>
      )}

      {visibleSteps.length > 0 && (
        <ul className={styles.steps}>
          {visibleSteps.map((step, index) => (
            <li key={step.id} className={styles.step}>
              <input type="checkbox" checked={step.completed} onChange={(event) => handleToggleStep(step.id, event.target.checked)} aria-label={step.title} />
              {editingStepId === step.id ? (
                <input
                  className={styles.editTitle}
                  aria-label={`Editar passo ${step.title}`}
                  value={editingTitle}
                  onChange={(event) => setEditingTitle(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") { event.preventDefault(); handleSaveStepTitle(step.id); }
                    if (event.key === "Escape") setEditingStepId(null);
                  }}
                  autoFocus
                />
              ) : <span className={`${styles.stepTitle} ${step.completed ? styles.stepTitleDone : ""}`}>{step.title}</span>}
              {editingStepId === step.id ? (
                <>
                  <button type="button" className={styles.actionButton} onClick={() => handleSaveStepTitle(step.id)} aria-label={`Salvar passo ${step.title}`}><Icon name="FaCheck" aria-hidden="true" /></button>
                  <button type="button" className={styles.actionButton} onClick={() => setEditingStepId(null)} aria-label="Cancelar edição"><Icon name="FaTimes" aria-hidden="true" /></button>
                </>
              ) : <button type="button" className={styles.actionButton} onClick={() => { setEditingStepId(step.id); setEditingTitle(step.title); }} aria-label={`Editar passo ${step.title}`}><Icon name="FaEdit" aria-hidden="true" /></button>}
              <div className={styles.orderActions} aria-label={`Reordenar ${step.title}`}>
                <button type="button" className={styles.actionButton} onClick={() => handleMoveStep(step.id, -1)} aria-label={`Mover ${step.title} para cima`} disabled={index === 0}><Icon name="FaChevronUp" aria-hidden="true" /></button>
                <button type="button" className={styles.actionButton} onClick={() => handleMoveStep(step.id, 1)} aria-label={`Mover ${step.title} para baixo`} disabled={index === visibleSteps.length - 1}><Icon name="FaChevronDown" aria-hidden="true" /></button>
              </div>
              <ConfirmIconButton icon="FaTrash" ariaLabel={`Remover passo ${step.title}`} confirmText={`Remover o passo \"${step.title}\"?`} className={styles.smallButton} onConfirm={() => handleRemoveStep(step.id)} />
            </li>
          ))}
        </ul>
      )}

      <div className={styles.addStepForm}>
        <Input.Field aria-label="Título do novo passo" placeholder="Adicionar um passo..." value={newStepTitle} onChange={(event) => setNewStepTitle(event.target.value)} onKeyDown={handleTitleKeyDown} />
        <Button.Root type="button" variant="secondary" className={styles.smallButton} aria-label="Adicionar passo" onClick={handleQueueStep}><Button.Icon name="FaPlus" /></Button.Root>
      </div>
    </div>
  );
}

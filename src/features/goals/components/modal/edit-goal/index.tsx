"use client";

import dayjs from "dayjs";
import { useState } from "react";

import { validationSchema } from "@/validation/goal-schema";

import { Alert, Form, Modal, ModalHeader, Input, Button, ChipGroup, SuggestionChips, CollapsibleSection, ConfirmIconButton } from "@/components";
import { Icon } from "@/components/icon";
import modalStyles from "@/components/modal/styles.module.css";

import {
  createGoalStepAction,
  deleteGoalStepAction,
  reorderGoalStepsAction,
  updateGoalAction,
  updateGoalStepAction,
} from "@/features/goals/actions";
import { ShareSelect } from "@/features/connections/components/share-select";
import { ShareReadOnlyNote } from "@/features/connections/components/share-readonly-note";
import { calculateGoalProgress } from "@/features/goals/domain";
import { useGoalStore } from "@/features/goals/goal-store";
import { useFormModal } from "@/hooks/use-form-modal";

import { FormData, IEditGoalProps, PRIORITY_OPTIONS } from "../interfaces";

import styles from "./styles.module.css";

const DEADLINE_SHORTCUTS = [
  { label: "+1 semana", value: () => dayjs().add(1, "week").format("YYYY-MM-DD") },
  { label: "+1 mês", value: () => dayjs().add(1, "month").format("YYYY-MM-DD") },
  { label: "+3 meses", value: () => dayjs().add(3, "month").format("YYYY-MM-DD") },
];

export function EditGoal({ goalBeingEdited, connections }: IEditGoalProps) {
  const [stepTitle, setStepTitle] = useState("");
  const [newSteps, setNewSteps] = useState<string[]>([]);
  const [orderedSteps, setOrderedSteps] = useState(goalBeingEdited.steps);
  const [removedStepIds, setRemovedStepIds] = useState<string[]>([]);
  const [editingStepId, setEditingStepId] = useState<string | null>(null);
  const [editingStepTitle, setEditingStepTitle] = useState("");
  const replaceGoal = useGoalStore((state) => state.replaceGoal);
  const completedSteps = orderedSteps.filter((step) => step.completed).length;
  const totalSteps = orderedSteps.length + newSteps.length;

  function moveStep(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= orderedSteps.length) return;
    const next = [...orderedSteps];
    [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
    setOrderedSteps(next);
  }

  function saveStepTitle(stepId: string) {
    const title = editingStepTitle.trim();
    if (!title) return;

    setOrderedSteps((current) => current.map((step) => (
      step.id === stepId ? { ...step, title } : step
    )));
    setEditingStepId(null);
    setEditingStepTitle("");
  }
  const {
    register,
    setValue,
    watch,
    formState: { errors, isSubmitting },
    isOpen,
    openModal,
    closeModal,
    submitError,
    handleFormSubmit,
  } = useFormModal<FormData>({
    schema: validationSchema,
    defaultValues: {
      title: goalBeingEdited.title,
      description: goalBeingEdited.description,
      deadline: goalBeingEdited.deadline || "",
      priority: goalBeingEdited.priority,
      sharedWithUserId: goalBeingEdited.sharedWithUserId ?? "",
    },
    onSubmit: async (data) => {
      const result = await updateGoalAction({
        id: goalBeingEdited.id,
        title: data.title,
        description: data.description,
        deadline: data.deadline || null,
        priority: data.priority,
        sharedWithUserId: data.sharedWithUserId,
      });
      if (result.error) return result;

      for (const step of orderedSteps) {
        const originalStep = goalBeingEdited.steps.find((item) => item.id === step.id);
        if (originalStep && originalStep.title !== step.title) {
          const stepResult = await updateGoalStepAction({ id: step.id, title: step.title });
          if (stepResult.error) return stepResult;
        }
      }

      const createdStepIds: string[] = [];
      for (const id of removedStepIds) {
        const deleteResult = await deleteGoalStepAction({ id });
        if (deleteResult.error) return deleteResult;
      }
      for (const title of newSteps) {
        const stepResult = await createGoalStepAction({ goalId: goalBeingEdited.id, title });
        if (stepResult.error) return stepResult;
        if (stepResult.id) createdStepIds.push(stepResult.id);
      }
      const reorderResult = await reorderGoalStepsAction({
        goalId: goalBeingEdited.id,
        orderedStepIds: [...orderedSteps.map((step) => step.id), ...createdStepIds],
      });
      if (reorderResult.error) return reorderResult;

      const steps = [
        ...orderedSteps.map((step, order) => ({ ...step, order })),
        ...newSteps.flatMap((title, index) => {
          const id = createdStepIds[index];
          return id ? [{ id, goalId: goalBeingEdited.id, title, completed: false, order: orderedSteps.length + index }] : [];
        }),
      ];
      replaceGoal({
        ...goalBeingEdited,
        title: data.title,
        description: data.description,
        deadline: data.deadline || null,
        priority: data.priority,
        sharedWithUserId: data.sharedWithUserId || null,
        steps,
        progressPercent: calculateGoalProgress(steps),
      });
      setNewSteps([]);
      return result;
    },
    onSuccess: () => {},
  });

  const priority = watch("priority");

  return (
    <>
      <Button.Preset
        icon={{ name: "FaEdit" }}
        root={{
          tone: "highlight",
          "aria-label": `Editar objetivo ${goalBeingEdited.title}`,
          onClick: openModal,
        }}
      />

      {isOpen && (
        <Modal onClose={closeModal} className={modalStyles.wide}>
          <ModalHeader title="Editar Objetivo" onClose={closeModal} />

          <Form.Root onSubmit={handleFormSubmit}>
            <Form.Wrapper>
              <Input.Root sharedProps={{ error: errors.title?.message }}>
                <Input.Label htmlFor="title">Título</Input.Label>

                <Input.Wrapper>
                  <Input.Field
                    className={styles.titleField}
                    {...register("title")}
                    placeholder="Qual objetivo você quer alcançar?"
                    autoFocus
                  />
                </Input.Wrapper>

                <Input.HelperText />
              </Input.Root>

              <Input.Root sharedProps={{ error: errors.description?.message }}>
                <Input.Label htmlFor="description">
                  <Icon name="FaAlignLeft" size={12} /> Descrição
                </Input.Label>
                <Input.Wrapper>
                  <Input.FieldTextarea
                    {...register("description")}
                    rows={3}
                    placeholder="Detalhes (opcional)"
                  />
                </Input.Wrapper>

                <Input.HelperText />
              </Input.Root>

              <Input.Root sharedProps={{ error: errors.deadline?.message }}>
                <Input.Label htmlFor="deadline">
                  <Icon name="FaCalendarAlt" size={12} /> Prazo (opcional)
                </Input.Label>

                <Input.Wrapper>
                  <Input.Field {...register("deadline")} type="date" />
                </Input.Wrapper>

                <SuggestionChips
                  label="Atalhos de prazo"
                  suggestions={DEADLINE_SHORTCUTS.map((shortcut) => shortcut.label)}
                  onSelect={(label) => {
                    const shortcut = DEADLINE_SHORTCUTS.find((option) => option.label === label);
                    if (shortcut) setValue("deadline", shortcut.value(), { shouldValidate: true });
                  }}
                />

                <Input.HelperText />
              </Input.Root>

              <Input.Root sharedProps={{ error: errors.priority?.message }}>
                <Input.Label>
                  <Icon name="FaFlag" size={12} /> Prioridade
                </Input.Label>

                <ChipGroup
                  aria-label="Prioridade"
                  options={PRIORITY_OPTIONS}
                  value={priority}
                  onChange={(value) => setValue("priority", value as FormData["priority"], { shouldValidate: true })}
                />

                <Input.HelperText />
              </Input.Root>

              <Input.Root>
                <Input.Label>Adicionar passos</Input.Label>
                {totalSteps > 0 && <p className={styles.stepsHint}>{completedSteps} de {totalSteps} passos concluídos.</p>}
                <div className={styles.stepsAddRow}>
                  <Input.Wrapper>
                    <Input.Field value={stepTitle} onChange={(event) => setStepTitle(event.target.value)} placeholder="Ex.: Pesquisar opções" />
                  </Input.Wrapper>
                  <Button.Root type="button" variant="secondary" className={styles.smallButton} aria-label="Adicionar passo" onClick={() => {
                    const title = stepTitle.trim();
                    if (title) { setNewSteps((current) => [...current, title]); setStepTitle(""); }
                  }}><Button.Icon name="FaPlus" /></Button.Root>
                </div>
                {orderedSteps.length > 0 && (
                  <ul className={styles.stepsDraft}>
                    {orderedSteps.map((step, index) => (
                      <li key={step.id}>
                        <input type="checkbox" checked={step.completed} readOnly aria-label={step.title} />
                        {editingStepId === step.id ? (
                          <input
                            className={styles.editTitle}
                            value={editingStepTitle}
                            onChange={(event) => setEditingStepTitle(event.target.value)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter") {
                                event.preventDefault();
                                saveStepTitle(step.id);
                              }
                              if (event.key === "Escape") setEditingStepId(null);
                            }}
                            aria-label={`Editar passo ${step.title}`}
                            autoFocus
                          />
                        ) : <span>{step.title}</span>}
                        {editingStepId === step.id ? (
                          <>
                            <button type="button" className={styles.actionButton} onClick={() => saveStepTitle(step.id)} aria-label={`Salvar passo ${step.title}`}><Icon name="FaCheck" /></button>
                            <button type="button" className={styles.actionButton} onClick={() => setEditingStepId(null)} aria-label="Cancelar edição"><Icon name="FaTimes" /></button>
                          </>
                        ) : (
                          <button type="button" className={styles.actionButton} onClick={() => { setEditingStepId(step.id); setEditingStepTitle(step.title); }} aria-label={`Editar passo ${step.title}`}><Icon name="FaEdit" /></button>
                        )}
                        <div className={styles.orderActions} aria-label={`Reordenar ${step.title}`}>
                          <button type="button" className={styles.actionButton} disabled={index === 0} onClick={() => moveStep(index, -1)} aria-label={`Mover ${step.title} para cima`}><Icon name="FaChevronUp" /></button>
                          <button type="button" className={styles.actionButton} disabled={index === orderedSteps.length - 1} onClick={() => moveStep(index, 1)} aria-label={`Mover ${step.title} para baixo`}><Icon name="FaChevronDown" /></button>
                        </div>
                        <ConfirmIconButton icon="FaTrash" ariaLabel={`Remover passo ${step.title}`} confirmText={`Remover o passo \"${step.title}\"?`} className={styles.smallButton} onConfirm={() => { setRemovedStepIds((current) => [...current, step.id]); setOrderedSteps((current) => current.filter((item) => item.id !== step.id)); }} />
                      </li>
                    ))}
                  </ul>
                )}
                {newSteps.length > 0 && <ul className={styles.stepsDraft}>{newSteps.map((title, index) => <li key={`${title}-${index}`}><input type="checkbox" checked={false} readOnly aria-label={`Novo passo ${title}`} /><span>{title}</span><button type="button" className={styles.actionButton} onClick={() => setNewSteps((current) => current.filter((_, itemIndex) => itemIndex !== index))} aria-label={`Remover passo ${title}`}><Icon name="FaTimes" /></button></li>)}</ul>}
              </Input.Root>

              <CollapsibleSection label="Mais opções">
                <Input.Root sharedProps={{ error: errors.sharedWithUserId?.message }}>
                  <Input.Label htmlFor="sharedWithUserId">Compartilhar com</Input.Label>

                  <Input.Wrapper>
                    <ShareSelect
                      connections={connections}
                      disabled={goalBeingEdited.isSharedWithMe}
                      {...register("sharedWithUserId")}
                    />
                  </Input.Wrapper>

                  <Input.HelperText />
                </Input.Root>

                {goalBeingEdited.isSharedWithMe && (
                  <ShareReadOnlyNote noun="este objetivo" className={styles.readOnlyNote} />
                )}
              </CollapsibleSection>
            </Form.Wrapper>

            {submitError && <Alert variant="error">{submitError}</Alert>}

            <Button.Root loading={isSubmitting}>Salvar Alterações</Button.Root>
          </Form.Root>
        </Modal>
      )}
    </>
  );
}

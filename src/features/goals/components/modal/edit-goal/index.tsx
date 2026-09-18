"use client";

import dayjs from "dayjs";
import { useState } from "react";

import { validationSchema } from "@/validation/goal-schema";

import { Alert, Form, Modal, ModalHeader, Input, Button, ChipGroup, SuggestionChips, CollapsibleSection } from "@/components";
import { Icon } from "@/components/icon";
import modalStyles from "@/components/modal/styles.module.css";

import { createGoalStepAction, reorderGoalStepsAction, updateGoalAction } from "@/features/goals/actions";
import { ShareSelect } from "@/features/connections/components/share-select";
import { ShareReadOnlyNote } from "@/features/connections/components/share-readonly-note";
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
  const [isReordering, setIsReordering] = useState(false);

  async function moveStep(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= orderedSteps.length || isReordering) return;
    const next = [...orderedSteps];
    [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
    setIsReordering(true);
    const result = await reorderGoalStepsAction({ goalId: goalBeingEdited.id, orderedStepIds: next.map((step) => step.id) });
    if (!result.error) setOrderedSteps(next);
    setIsReordering(false);
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
      for (const title of newSteps) {
        const stepResult = await createGoalStepAction({ goalId: goalBeingEdited.id, title });
        if (stepResult.error) return stepResult;
      }
      setNewSteps([]);
      return result;
    },
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
                {orderedSteps.length > 0 && <ul className={styles.stepsDraft}>{orderedSteps.map((step, index) => <li key={step.id}><span className={styles.pendingMarker}>•</span><span>{step.title}</span><button type="button" className={styles.orderButton} disabled={index === 0 || isReordering} onClick={() => moveStep(index, -1)} aria-label={`Mover ${step.title} para cima`}><Icon name="FaChevronUp" /></button><button type="button" className={styles.orderButton} disabled={index === orderedSteps.length - 1 || isReordering} onClick={() => moveStep(index, 1)} aria-label={`Mover ${step.title} para baixo`}><Icon name="FaChevronDown" /></button></li>)}</ul>}
                <div className={styles.stepsAddRow}>
                  <Input.Wrapper>
                    <Input.Field value={stepTitle} onChange={(event) => setStepTitle(event.target.value)} placeholder="Ex.: Pesquisar opções" />
                  </Input.Wrapper>
                  <Button.Root type="button" variant="secondary" className={styles.smallButton} aria-label="Adicionar passo" onClick={() => {
                    const title = stepTitle.trim();
                    if (title) { setNewSteps((current) => [...current, title]); setStepTitle(""); }
                  }}><Button.Icon name="FaPlus" /></Button.Root>
                </div>
                {newSteps.length > 0 && <ul className={styles.stepsDraft}>{newSteps.map((title, index) => <li key={`${title}-${index}`}><span className={styles.pendingMarker}>+</span><span>{title}</span><button type="button" onClick={() => setNewSteps((current) => current.filter((_, itemIndex) => itemIndex !== index))} aria-label={`Remover passo ${title}`}>×</button></li>)}</ul>}
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

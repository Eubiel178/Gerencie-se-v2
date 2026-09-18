"use client";

import dayjs from "dayjs";
import { useRef } from "react";

import { validationSchema } from "@/validation/goal-schema";

import { Alert, Form, Modal, ModalHeader, Input, Button, ChipGroup, SuggestionChips, CollapsibleSection } from "@/components";
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
import { GoalSteps, GoalStepsDraft } from "../goal-steps";

import styles from "./styles.module.css";

const DEADLINE_SHORTCUTS = [
  { label: "+1 semana", value: () => dayjs().add(1, "week").format("YYYY-MM-DD") },
  { label: "+1 mês", value: () => dayjs().add(1, "month").format("YYYY-MM-DD") },
  { label: "+3 meses", value: () => dayjs().add(3, "month").format("YYYY-MM-DD") },
];

export function EditGoal({ goalBeingEdited, connections }: IEditGoalProps) {
  const stepsDraft = useRef<GoalStepsDraft>({
    existingSteps: goalBeingEdited.steps,
    newStepTitles: [],
  });
  const replaceGoal = useGoalStore((state) => state.replaceGoal);

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

      const draft = stepsDraft.current;
      for (const step of draft.existingSteps) {
        const originalStep = goalBeingEdited.steps.find((item) => item.id === step.id);
        if (!originalStep) continue;
        if (originalStep.title !== step.title || originalStep.completed !== step.completed) {
          const stepResult = await updateGoalStepAction({
            id: step.id,
            ...(originalStep.title !== step.title ? { title: step.title } : {}),
            ...(originalStep.completed !== step.completed ? { completed: step.completed } : {}),
          });
          if (stepResult.error) return stepResult;
        }
      }

      const createdStepIds: string[] = [];
      const draftStepIds = new Set(draft.existingSteps.map((step) => step.id));
      for (const step of goalBeingEdited.steps) {
        if (!draftStepIds.has(step.id)) {
          const deleteResult = await deleteGoalStepAction({ id: step.id });
          if (deleteResult.error) return deleteResult;
        }
      }
      for (const title of draft.newStepTitles) {
        const stepResult = await createGoalStepAction({ goalId: goalBeingEdited.id, title });
        if (stepResult.error) return stepResult;
        if (stepResult.id) createdStepIds.push(stepResult.id);
      }
      const orderedStepIds = [
        ...draft.existingSteps.map((step) => step.id),
        ...createdStepIds,
      ];
      const reorderResult = await reorderGoalStepsAction({
        goalId: goalBeingEdited.id,
        orderedStepIds,
      });
      if (reorderResult.error) return reorderResult;

      const steps = [
        ...draft.existingSteps.map((step, order) => ({ ...step, order })),
        ...draft.newStepTitles.flatMap((title, index) => {
          const id = createdStepIds[index];
          return id ? [{ id, goalId: goalBeingEdited.id, title, completed: false, order: draft.existingSteps.length + index }] : [];
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
      stepsDraft.current = { existingSteps: steps, newStepTitles: [] };
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
                <Input.Label>
                  <Icon name="FaListUl" size={12} /> Passos
                </Input.Label>
                <GoalSteps
                  steps={goalBeingEdited.steps}
                  onDraftChange={(draft) => {
                    stepsDraft.current = draft;
                  }}
                />
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

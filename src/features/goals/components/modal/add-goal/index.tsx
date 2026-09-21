"use client";

import { useRef } from "react";

import dayjs from "dayjs";


import { Alert, Form, Input, Modal, ModalHeader, Button, ChipGroup, SuggestionChips, CollapsibleSection } from "@/components";
import { Icon } from "@/components/icon";
import modalStyles from "@/components/modal/styles.module.css";
import { ShareSelect } from "@/features/connections/components/share-select";
import { createGoalAction, createGoalStepAction } from "@/features/goals/actions";
import { useGoalStore } from "@/features/goals/goal-store";
import { useFormModal } from "@/hooks/use-form-modal";
import { validationSchema } from "@/validation/goal-schema";

import { GoalSteps, GoalStepsDraft } from "../goal-steps";
import { FormData, IAddGoalProps, PRIORITY_OPTIONS } from "../interfaces";

import styles from "./styles.module.css";

const DEADLINE_SHORTCUTS = [
  { label: "+1 semana", value: () => dayjs().add(1, "week").format("YYYY-MM-DD") },
  { label: "+1 mês", value: () => dayjs().add(1, "month").format("YYYY-MM-DD") },
  { label: "+3 meses", value: () => dayjs().add(3, "month").format("YYYY-MM-DD") },
];

export function AddGoal({ buttonText, connections }: IAddGoalProps) {
  const addGoal = useGoalStore((state) => state.addGoal);
  const stepsDraft = useRef<GoalStepsDraft>({
    existingSteps: [],
    newStepTitles: [],
  });
  const {
    setValue,
    watch,
    register,
    formState: { errors, isSubmitting },
    isOpen,
    openModal,
    closeModal,
    submitError,
    handleFormSubmit,
  } = useFormModal<FormData, Awaited<ReturnType<typeof createGoalAction>>>({
    schema: validationSchema,
    defaultValues: {
      title: "",
      description: "",
      deadline: "",
      priority: "media",
      sharedWithUserId: "",
    },
    onSubmit: async (data) => {
      const result = await createGoalAction({
        title: data.title,
        description: data.description,
        deadline: data.deadline || null,
        priority: data.priority,
        sharedWithUserId: data.sharedWithUserId,
      });
      if (result.error || !result.goal) return result;
      const createdGoal = result.goal;
      const titles = stepsDraft.current.newStepTitles;
      const createdStepIds: string[] = [];
      for (const title of titles) {
        const stepResult = await createGoalStepAction({ goalId: createdGoal.id, title });
        if (stepResult.error) return stepResult;
        if (stepResult.id) createdStepIds.push(stepResult.id);
      }
      stepsDraft.current = { existingSteps: [], newStepTitles: [] };
      return {
        ...result,
        goal: {
          ...createdGoal,
          steps: titles.flatMap((title, index) => {
            const id = createdStepIds[index];
            return id ? [{ id, goalId: createdGoal.id, title, completed: false, order: index }] : [];
          }),
        },
      };
    },
    onSuccess: (result) => {
      if (result.goal) addGoal(result.goal);
    },
  });

  const priority = watch("priority");

  return (
    <>
      <Button.Root type="button" onClick={openModal}>
        {buttonText}
      </Button.Root>

      {isOpen && (
        <Modal onClose={closeModal} className={modalStyles.wide}>
          <ModalHeader title="Novo Objetivo" onClose={closeModal} />

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
                  <Icon name="FaListUl" size={12} /> Passos (opcional)
                </Input.Label>
                <GoalSteps
                  steps={[]}
                  onDraftChange={(draft) => {
                    stepsDraft.current = draft;
                  }}
                />
              </Input.Root>

              <CollapsibleSection label="Mais opções">
                <Input.Root sharedProps={{ error: errors.sharedWithUserId?.message }}>
                  <Input.Label htmlFor="sharedWithUserId">Compartilhar com</Input.Label>

                  <Input.Wrapper>
                    <ShareSelect connections={connections} {...register("sharedWithUserId")} />
                  </Input.Wrapper>

                  <Input.HelperText />
                </Input.Root>
              </CollapsibleSection>
            </Form.Wrapper>

            {submitError && <Alert variant="error">{submitError}</Alert>}

            <Button.Root loading={isSubmitting}>Adicionar Objetivo</Button.Root>
          </Form.Root>
        </Modal>
      )}
    </>
  );
}

"use client";

import dayjs from "dayjs";
import { useState } from "react";

import { validationSchema } from "@/validation/goal-schema";

import { Alert, Form, Input, Modal, ModalHeader, Button, ChipGroup, SuggestionChips, CollapsibleSection } from "@/components";
import { Icon } from "@/components/icon";
import modalStyles from "@/components/modal/styles.module.css";

import { createGoalAction, createGoalStepAction } from "@/features/goals/actions";
import { useGoalStore } from "@/features/goals/goal-store";
import { ShareSelect } from "@/features/connections/components/share-select";
import { useFormModal } from "@/hooks/use-form-modal";

import { FormData, IAddGoalProps, PRIORITY_OPTIONS } from "../interfaces";

import styles from "./styles.module.css";

const DEADLINE_SHORTCUTS = [
  { label: "+1 semana", value: () => dayjs().add(1, "week").format("YYYY-MM-DD") },
  { label: "+1 mês", value: () => dayjs().add(1, "month").format("YYYY-MM-DD") },
  { label: "+3 meses", value: () => dayjs().add(3, "month").format("YYYY-MM-DD") },
];

export function AddGoal({ buttonText, connections }: IAddGoalProps) {
  const addGoal = useGoalStore((state) => state.addGoal);
  const [stepTitle, setStepTitle] = useState("");
  const [stepTitles, setStepTitles] = useState<string[]>([]);
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
      const titles = stepTitles;
      const createdStepIds: string[] = [];
      for (const title of titles) {
        const stepResult = await createGoalStepAction({ goalId: createdGoal.id, title });
        if (stepResult.error) return stepResult;
        if (stepResult.id) createdStepIds.push(stepResult.id);
      }
      setStepTitles([]);
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
  const totalSteps = stepTitles.length;

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
                <Input.Label>Passos (opcional)</Input.Label>
                {totalSteps > 0 && <p className={styles.stepsHint}>0 de {totalSteps} passos concluídos.</p>}
                <div className={styles.stepsAddRow}>
                  <Input.Wrapper>
                    <Input.Field
                      value={stepTitle}
                      onChange={(event) => setStepTitle(event.target.value)}
                      placeholder="Ex.: Pesquisar opções"
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          const title = stepTitle.trim();
                          if (title) { setStepTitles((current) => [...current, title]); setStepTitle(""); }
                        }
                      }}
                    />
                  </Input.Wrapper>
                  <Button.Root type="button" variant="secondary" className={styles.smallButton} aria-label="Adicionar passo" onClick={() => {
                    const title = stepTitle.trim();
                    if (title) { setStepTitles((current) => [...current, title]); setStepTitle(""); }
                  }}><Button.Icon name="FaPlus" /></Button.Root>
                </div>
                {stepTitles.length > 0 && <ul className={styles.stepsDraft}>{stepTitles.map((title, index) => <li key={`${title}-${index}`}><input type="checkbox" checked={false} readOnly aria-label={`Novo passo ${title}`} /><span>{title}</span><button type="button" className={styles.actionButton} onClick={() => setStepTitles((current) => current.filter((_, itemIndex) => itemIndex !== index))} aria-label={`Remover passo ${title}`}><Icon name="FaTimes" /></button></li>)}</ul>}
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

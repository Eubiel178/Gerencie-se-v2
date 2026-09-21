"use client";

import { useWatch } from "react-hook-form";


import { Alert, Form, Input, Modal, ModalHeader, Button, ChipGroup, SuggestionChips, CollapsibleSection } from "@/components";
import { Icon } from "@/components/icon";
import modalStyles from "@/components/modal/styles.module.css";
import { ShareSelect } from "@/features/connections/components/share-select";
import { createHabitAction } from "@/features/habits/actions";
import { useFormModal } from "@/hooks/use-form-modal";
import { validationSchema } from "@/validation/habit-schema";

import { FormData, IAddHabitProps, NO_GOAL_VALUE } from "../interfaces";

import styles from "./styles.module.css";

const FREQUENCY_OPTIONS = [
  { label: "Todo dia", value: "daily" },
  { label: "Algumas vezes por semana", value: "weekly" },
];

const TITLE_SUGGESTIONS = ["Beber água", "Ler", "Meditar", "Exercício", "Dormir cedo"];

export function AddHabit({ buttonText, connections, goalOptions }: IAddHabitProps) {
  const {
    register,
    control,
    setValue,
    formState: { errors, isSubmitting },
    isOpen,
    openModal,
    requestClose,
    discardConfirmDialog,
    submitError,
    handleFormSubmit,
  } = useFormModal<FormData>({
    schema: validationSchema,
    defaultValues: {
      title: "",
      frequency: "daily",
      targetPerWeek: "3",
      goalId: NO_GOAL_VALUE,
      sharedWithUserId: "",
    },
    onSubmit: (data) =>
      createHabitAction({
        title: data.title,
        frequency: data.frequency,
        targetPerWeek: data.frequency === "weekly" ? Number(data.targetPerWeek) : null,
        goalId: data.goalId === NO_GOAL_VALUE ? null : data.goalId,
        sharedWithUserId: data.sharedWithUserId,
      }),
  });

  const frequency = useWatch({ control, name: "frequency" });

  return (
    <>
      <Button.Root type="button" onClick={openModal}>
        {buttonText}
      </Button.Root>

      {isOpen && (
        <Modal onClose={requestClose} className={modalStyles.medium}>
          <ModalHeader title="Novo Hábito" onClose={requestClose} />

          <Form.Root onSubmit={handleFormSubmit}>
            <Form.Wrapper>
              <Input.Root sharedProps={{ error: errors.title?.message }}>
                <Input.Label htmlFor="title">Título</Input.Label>

                <Input.Wrapper>
                  <Input.Field
                    className={styles.titleField}
                    {...register("title")}
                    placeholder="Que hábito você quer criar?"
                    autoFocus
                  />
                </Input.Wrapper>

                <SuggestionChips
                  label="Sugestões"
                  suggestions={TITLE_SUGGESTIONS}
                  onSelect={(value) => setValue("title", value, { shouldValidate: true, shouldDirty: true })}
                />

                <Input.HelperText />
              </Input.Root>

              <Input.Root sharedProps={{ error: errors.frequency?.message }}>
                <Input.Label>
                  <Icon name="FaCalendarAlt" size={12} /> Frequência
                </Input.Label>

                <ChipGroup
                  aria-label="Frequência"
                  options={FREQUENCY_OPTIONS}
                  value={frequency}
                  onChange={(value) => setValue("frequency", value as FormData["frequency"], { shouldValidate: true, shouldDirty: true })}
                />

                <Input.HelperText />
              </Input.Root>

              {frequency === "weekly" && (
                <Input.Root sharedProps={{ error: errors.targetPerWeek?.message }}>
                  <Input.Label htmlFor="targetPerWeek">Quantas vezes por semana</Input.Label>

                  <Input.Wrapper>
                    <Input.Field
                      {...register("targetPerWeek")}
                      type="number"
                      min={1}
                      max={7}
                    />
                  </Input.Wrapper>

                  <Input.HelperText />
                </Input.Root>
              )}

              <CollapsibleSection label="Mais opções">
                {goalOptions.length > 0 && (
                  <Input.Root>
                    <Input.Label htmlFor="goalId">Vincular a um objetivo (opcional)</Input.Label>

                    <Input.Wrapper>
                      <Input.FieldSelect
                        {...register("goalId")}
                        optionsArray={[
                          { label: "Nenhum", value: NO_GOAL_VALUE },
                          ...goalOptions.map((goal) => ({ label: goal.title, value: goal.id })),
                        ]}
                      />
                    </Input.Wrapper>
                  </Input.Root>
                )}

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

            <Button.Root loading={isSubmitting}>Adicionar Hábito</Button.Root>
          </Form.Root>
        </Modal>
      )}

      {discardConfirmDialog}
    </>
  );
}

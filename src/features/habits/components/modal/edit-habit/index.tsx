"use client";

import { useWatch } from "react-hook-form";

import { validationSchema } from "@/validation/habit-schema";

import { Alert, Form, Modal, ModalHeader, Input, Button, ChipGroup, SuggestionChips, CollapsibleSection } from "@/components";
import { Icon } from "@/components/icon";
import modalStyles from "@/components/modal/styles.module.css";

import { updateHabitAction } from "@/features/habits/actions";
import { ShareSelect } from "@/features/connections/components/share-select";
import { ShareReadOnlyNote } from "@/features/connections/components/share-readonly-note";
import { useFormModal } from "@/hooks/use-form-modal";

import { FormData, IEditHabitProps, NO_GOAL_VALUE } from "../interfaces";

import styles from "./edit-habit.module.css";

const FREQUENCY_OPTIONS = [
  { label: "Todo dia", value: "daily" },
  { label: "Algumas vezes por semana", value: "weekly" },
];

const TITLE_SUGGESTIONS = ["Beber água", "Ler", "Meditar", "Exercício", "Dormir cedo"];

export function EditHabit({ habitBeingEdited, connections, goalOptions }: IEditHabitProps) {
  const {
    register,
    control,
    setValue,
    formState: { errors, isSubmitting },
    isOpen,
    openModal,
    closeModal,
    submitError,
    handleFormSubmit,
  } = useFormModal<FormData>({
    schema: validationSchema,
    defaultValues: {
      title: habitBeingEdited.title,
      frequency: habitBeingEdited.frequency,
      targetPerWeek: String(habitBeingEdited.targetPerWeek ?? 3),
      goalId: habitBeingEdited.goalId || NO_GOAL_VALUE,
      sharedWithUserId: habitBeingEdited.sharedWithUserId ?? "",
    },
    onSubmit: (data) =>
      updateHabitAction({
        id: habitBeingEdited.id,
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
      <Button.Preset
        icon={{ name: "FaEdit" }}
        root={{
          tone: "highlight",
          "aria-label": `Editar hábito ${habitBeingEdited.title}`,
          onClick: openModal,
        }}
      />

      {isOpen && (
        <Modal onClose={closeModal} className={modalStyles.medium}>
          <ModalHeader title="Editar Hábito" onClose={closeModal} />

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
                  onSelect={(value) => setValue("title", value, { shouldValidate: true })}
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
                  onChange={(value) => setValue("frequency", value as FormData["frequency"], { shouldValidate: true })}
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
                    <ShareSelect
                      connections={connections}
                      disabled={habitBeingEdited.isSharedWithMe}
                      {...register("sharedWithUserId")}
                    />
                  </Input.Wrapper>

                  <Input.HelperText />
                </Input.Root>

                {habitBeingEdited.isSharedWithMe && (
                  <p className={styles.readOnlyNote}>
                    Só quem compartilhou este hábito pode mudar isso.
                  </p>
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

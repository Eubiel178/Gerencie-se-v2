"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { FaEdit } from "react-icons/fa";
import { MdClose } from "react-icons/md";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { validationSchema } from "@/validation/habit-schema";

import { Form, Modal, Input, Button } from "@/components";

import { updateHabitAction } from "@/features/habits/actions";
import { ShareSelect } from "@/features/connections/components/share-select";

import { FormData, IEditHabitProps, NO_GOAL_VALUE } from "../interfaces";

import styles from "./edit-habit.module.css";

const FREQUENCY_OPTIONS = [
  { label: "Todo dia", value: "daily" },
  { label: "Algumas vezes por semana", value: "weekly" },
];

export function EditHabit({ habitBeingEdited, connections, goalOptions }: IEditHabitProps) {
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    reset,
    register,
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
  } = useForm<FormData>({
    mode: "onChange",
    resolver: zodResolver(validationSchema),
    defaultValues: {
      title: habitBeingEdited.title,
      frequency: habitBeingEdited.frequency,
      targetPerWeek: String(habitBeingEdited.targetPerWeek ?? 3),
      goalId: habitBeingEdited.goalId || NO_GOAL_VALUE,
      sharedWithUserId: habitBeingEdited.sharedWithUserId ?? "",
    },
  });

  const frequency = useWatch({ control, name: "frequency" });

  const closeModal = () => {
    setIsOpen(false);
    reset();
  };

  const handleFormSubmit = async (data: FormData) => {
    setSubmitError(null);

    const result = await updateHabitAction({
      id: habitBeingEdited.id,
      title: data.title,
      frequency: data.frequency,
      targetPerWeek: data.frequency === "weekly" ? Number(data.targetPerWeek) : null,
      goalId: data.goalId === NO_GOAL_VALUE ? null : data.goalId,
      sharedWithUserId: data.sharedWithUserId,
    });

    if (result.error) {
      setSubmitError(result.error);
      return;
    }

    closeModal();
    router.refresh();
  };

  return (
    <>
      <Button
        variant="ghost"
        tone="highlight"
        size="xlarge"
        aria-label={`Editar hábito ${habitBeingEdited.title}`}
        onClick={function () {
          setIsOpen(true);
        }}
      >
        <FaEdit />
      </Button>

      {isOpen && (
        <Modal>
          <div className={styles.modalHeader}>
            <h3>Editar Hábito</h3>

            <Button
              variant="ghost"
              tone="muted"
              size="xlarge"
              aria-label="Fechar"
              onClick={closeModal}
            >
              <MdClose />
            </Button>
          </div>

          <Form.Root onSubmit={handleSubmit(handleFormSubmit)}>
            <Form.Wrapper gap="xsmall">
              <Input.Root sharedProps={{ error: errors.title?.message }}>
                <Input.Wrapper>
                  <Input.Field
                    {...register("title")}
                    placeholder="Ex.: Beber água, Ler, Meditar..."
                  />
                </Input.Wrapper>

                <Input.HelperText />
              </Input.Root>

              <Input.Root sharedProps={{ error: errors.frequency?.message }}>
                <Input.Label>Frequência</Input.Label>

                <Input.Wrapper>
                  <Input.FieldSelect
                    {...register("frequency")}
                    optionsArray={FREQUENCY_OPTIONS}
                  />
                </Input.Wrapper>

                <Input.HelperText />
              </Input.Root>

              {frequency === "weekly" && (
                <Input.Root sharedProps={{ error: errors.targetPerWeek?.message }}>
                  <Input.Label>Quantas vezes por semana</Input.Label>

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

              {goalOptions.length > 0 && (
                <Input.Root>
                  <Input.Label>Vincular a um objetivo (opcional)</Input.Label>

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
                <Input.Label>Compartilhar com</Input.Label>

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
            </Form.Wrapper>

            {submitError && <p className={styles.formError}>{submitError}</p>}

            <Button loading={isSubmitting}>Salvar Alterações</Button>
          </Form.Root>
        </Modal>
      )}
    </>
  );
}

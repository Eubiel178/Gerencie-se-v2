"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { validationSchema } from "@/validation/routine-schema";

import { Form, Modal, ModalHeader, Input, Button } from "@/components";

import { updateRoutineItemAction } from "@/features/routine/actions";
import { ShareSelect } from "@/features/connections/components/share-select";
import { ShareReadOnlyNote } from "@/features/connections/components/share-readonly-note";

import { FormData, IEditRoutineItemProps, NO_TASK_VALUE } from "../interfaces";

import styles from "./edit-routine-item.module.css";

export function EditRoutineItem({ itemBeingEdited, taskOptions, connections }: IEditRoutineItemProps) {
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    reset,
    register,
    formState: { errors, isSubmitting },
    handleSubmit,
  } = useForm<FormData>({
    mode: "onChange",
    resolver: zodResolver(validationSchema),
    defaultValues: {
      time: itemBeingEdited.time,
      title: itemBeingEdited.title,
      taskId: itemBeingEdited.taskId || NO_TASK_VALUE,
      sharedWithUserId: itemBeingEdited.sharedWithUserId ?? "",
    },
  });

  const closeModal = () => {
    setIsOpen(false);
    reset();
  };

  const handleFormSubmit = async (data: FormData) => {
    setSubmitError(null);

    const result = await updateRoutineItemAction({
      id: itemBeingEdited.id,
      time: data.time,
      title: data.title,
      taskId: data.taskId === NO_TASK_VALUE ? null : data.taskId,
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
      <Button.Preset
        icon={{ name: "FaEdit" }}
        root={{
          tone: "highlight",
          "aria-label": `Editar item de rotina ${itemBeingEdited.title}`,
          onClick: function () {
            setIsOpen(true);
          },
        }}
      />

      {isOpen && (
        <Modal onClose={closeModal}>
          <ModalHeader title="Editar Item de Rotina" onClose={closeModal} />

          <Form.Root onSubmit={handleSubmit(handleFormSubmit)}>
            <Form.Wrapper>
              <Input.Root sharedProps={{ error: errors.time?.message }}>
                <Input.Label>Horário</Input.Label>

                <Input.Wrapper>
                  <Input.Field {...register("time")} type="time" />
                </Input.Wrapper>

                <Input.HelperText />
              </Input.Root>

              <Input.Root sharedProps={{ error: errors.title?.message }}>
                <Input.Wrapper>
                  <Input.Field
                    {...register("title")}
                    placeholder="Ex.: Acordar, Estudar, Exercício..."
                  />
                </Input.Wrapper>

                <Input.HelperText />
              </Input.Root>

              {taskOptions.length > 0 && (
                <Input.Root>
                  <Input.Label>Vincular a uma tarefa (opcional)</Input.Label>

                  <Input.Wrapper>
                    <Input.FieldSelect
                      {...register("taskId")}
                      optionsArray={[
                        { label: "Nenhuma", value: NO_TASK_VALUE },
                        ...taskOptions.map((task) => ({
                          label: task.title,
                          value: task.id,
                        })),
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
                    disabled={itemBeingEdited.isSharedWithMe}
                    {...register("sharedWithUserId")}
                  />
                </Input.Wrapper>

                <Input.HelperText />
              </Input.Root>

              {itemBeingEdited.isSharedWithMe && (
                <ShareReadOnlyNote noun="este item" className={styles.mutedNote} />
              )}
            </Form.Wrapper>

            {submitError && <p className={styles.formError}>{submitError}</p>}

            <Button.Root loading={isSubmitting}>Salvar Alterações</Button.Root>
          </Form.Root>
        </Modal>
      )}
    </>
  );
}

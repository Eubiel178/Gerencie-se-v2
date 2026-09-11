"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { validationSchema } from "@/validation/routine-schema";

import { Form, Input, Modal, ModalHeader, Button } from "@/components";

import { createRoutineItemAction } from "@/features/routine/actions";
import { ShareSelect } from "@/features/connections/components/share-select";
import { nowForTimeInput } from "@/utils";

import { FormData, IAddRoutineItemProps, NO_TASK_VALUE } from "../interfaces";

import styles from "./add-routine-item.module.css";

export function AddRoutineItem({ buttonText, taskOptions, connections }: IAddRoutineItemProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const router = useRouter();

  const {
    reset,
    register,
    formState: { errors, isSubmitting },
    handleSubmit,
  } = useForm<FormData>({
    mode: "onChange",
    resolver: zodResolver(validationSchema),
    defaultValues: {
      time: nowForTimeInput(),
      title: "",
      taskId: NO_TASK_VALUE,
      sharedWithUserId: "",
    },
  });

  function closeModal() {
    setIsOpen(false);
    reset();
  }

  function openModal() {
    reset({
      time: nowForTimeInput(),
      title: "",
      taskId: NO_TASK_VALUE,
      sharedWithUserId: "",
    });
    setIsOpen(true);
  }

  async function handleOnSubmit(data: FormData) {
    setSubmitError(null);

    const result = await createRoutineItemAction({
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
  }

  return (
    <>
      <Button.Root type="button" onClick={openModal}>
        {buttonText}
      </Button.Root>

      {isOpen && (
        <Modal onClose={closeModal}>
          <ModalHeader title="Novo Item de Rotina" onClose={closeModal} />

          <Form.Root onSubmit={handleSubmit(handleOnSubmit)}>
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
                  <ShareSelect connections={connections} {...register("sharedWithUserId")} />
                </Input.Wrapper>

                <Input.HelperText />
              </Input.Root>
            </Form.Wrapper>

            {submitError && <p className={styles.formError}>{submitError}</p>}

            <Button.Root loading={isSubmitting}>Adicionar à Rotina</Button.Root>
          </Form.Root>
        </Modal>
      )}
    </>
  );
}

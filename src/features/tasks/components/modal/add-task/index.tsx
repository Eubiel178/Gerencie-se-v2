"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { MdClose } from "react-icons/md";
import { useForm, useWatch } from "react-hook-form";
import { useFormTags } from "@/features/tasks/hooks/use-form-tags";
import { zodResolver } from "@hookform/resolvers/zod";

import { validationSchema } from "@/validation/task-schema";

import { Form, Input, Modal, Button } from "@/components";

import { createTaskAction } from "@/features/tasks/actions";

import { ShareSelect } from "@/features/connections/components/share-select";

import { SyncWithGoogle } from "../sync-with-google";
import { ReminderFields } from "../reminder-fields";
import { FormData, IAddTaskProps, PRIORITY_OPTIONS } from "../interfaces";

import styles from "./add-task.module.css";

export function AddTask({ buttonText, isGoogleConnected, connections }: IAddTaskProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const router = useRouter();

  const formTags = useFormTags();

  const {
    reset,
    register,
    setValue,
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
  } = useForm<FormData>({
    mode: "onChange",
    resolver: zodResolver(validationSchema),
    defaultValues: {
      tag: "",
      title: "",
      description: "",
      priority: "media",
      scheduledAt: "",
      reminderOffsetsMinutes: [],
      recurrence: "none",
      sharedWithUserId: "",
      syncEnabled: false,
    },
  });

  const syncEnabled = useWatch({ control, name: "syncEnabled" });
  const scheduledAt = useWatch({ control, name: "scheduledAt" });

  function closeModal() {
    setIsOpen(false);
    reset();
  }

  async function handleOnSubmit(data: FormData) {
    setSubmitError(null);

    const result = await createTaskAction(data);

    if (result.error) {
      setSubmitError(result.error);
      return;
    }

    closeModal();
    router.refresh();
  }

  return (
    <>
      <Button
        type="button"
        onClick={function () {
          setIsOpen(true);
        }}
      >
        {buttonText}
      </Button>

      {isOpen && (
        <Modal>
          <div className={styles.modalHeader}>
            <h3>Nova Tarefa</h3>

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

          <Form.Root onSubmit={handleSubmit(handleOnSubmit)}>
            <Form.Wrapper gap="xsmall">
              <Input.Root sharedProps={{ error: errors.tag?.message }}>
                <Input.Label>Tipo de Tarefa</Input.Label>

                <Input.Wrapper>
                  <Input.FieldSelect
                    {...register("tag")}
                    optionsArray={formTags.options}
                  />
                </Input.Wrapper>

                <Input.HelperText />
              </Input.Root>

              <Input.Root sharedProps={{ error: errors.title?.message }}>
                <Input.Wrapper>
                  <Input.Field
                    {...register("title")}
                    placeholder="Título da Tarefa"
                  />
                </Input.Wrapper>

                <Input.HelperText />
              </Input.Root>

              <Input.Root sharedProps={{ error: errors.description?.message }}>
                <Input.Wrapper>
                  <Input.FieldTextarea
                    {...register("description")}
                    rows={5}
                    placeholder="Descrição da Tarefa"
                  />
                </Input.Wrapper>

                <Input.HelperText />
              </Input.Root>

              <Input.Root sharedProps={{ error: errors.priority?.message }}>
                <Input.Label>Prioridade</Input.Label>

                <Input.Wrapper>
                  <Input.FieldSelect
                    {...register("priority")}
                    optionsArray={PRIORITY_OPTIONS}
                  />
                </Input.Wrapper>

                <Input.HelperText />
              </Input.Root>

              <ReminderFields
                register={register}
                scheduledAtError={errors.scheduledAt?.message}
                hasScheduledAt={!!scheduledAt}
              />

              <Input.Root sharedProps={{ error: errors.sharedWithUserId?.message }}>
                <Input.Label>Compartilhar com</Input.Label>

                <Input.Wrapper>
                  <ShareSelect connections={connections} {...register("sharedWithUserId")} />
                </Input.Wrapper>

                <Input.HelperText />
              </Input.Root>

              <SyncWithGoogle
                register={register}
                setValue={setValue}
                isChecked={!!syncEnabled}
                isGoogleConnected={isGoogleConnected}
              />
            </Form.Wrapper>

            {submitError && <p className={styles.formError}>{submitError}</p>}

            <Button loading={isSubmitting}>Nova Tarefa</Button>
          </Form.Root>
        </Modal>
      )}
    </>
  );
}

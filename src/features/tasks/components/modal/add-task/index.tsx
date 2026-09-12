"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { useForm, useWatch } from "react-hook-form";
import { useFormTags } from "@/features/tasks/hooks/use-form-tags";
import { zodResolver } from "@hookform/resolvers/zod";

import { validationSchema } from "@/validation/task-schema";

import { Form, Input, Modal, ModalHeader, Button, ChipGroup, CollapsibleSection } from "@/components";
import { Icon } from "@/components/icon";

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
  const priority = useWatch({ control, name: "priority" });

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
      <Button.Root
        type="button"
        onClick={function () {
          setIsOpen(true);
        }}
      >
        {buttonText}
      </Button.Root>

      {isOpen && (
        <Modal onClose={closeModal}>
          <ModalHeader title="Nova Tarefa" onClose={closeModal} />

          <Form.Root onSubmit={handleSubmit(handleOnSubmit)}>
            <Form.Wrapper>
              <Input.Root sharedProps={{ error: errors.title?.message }}>
                <Input.Wrapper>
                  <Input.Field
                    autoFocus
                    className={styles.titleField}
                    {...register("title")}
                    placeholder="O que você precisa fazer?"
                  />
                </Input.Wrapper>

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

              <Input.Root sharedProps={{ error: errors.tag?.message }}>
                <Input.Label>
                  <Icon name="FaTag" size={12} /> Tipo de Tarefa
                </Input.Label>

                <Input.Wrapper>
                  <Input.FieldSelect
                    {...register("tag")}
                    optionsArray={formTags.options}
                  />
                </Input.Wrapper>

                <Input.HelperText />
              </Input.Root>

              <Input.Root sharedProps={{ error: errors.description?.message }}>
                <Input.Label>
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

              <CollapsibleSection label="Mais opções">
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
              </CollapsibleSection>
            </Form.Wrapper>

            {submitError && <p className={styles.formError}>{submitError}</p>}

            <Button.Root loading={isSubmitting}>Nova Tarefa</Button.Root>
          </Form.Root>
        </Modal>
      )}
    </>
  );
}

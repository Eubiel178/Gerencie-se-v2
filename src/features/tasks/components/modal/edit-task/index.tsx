"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { useForm, useWatch } from "react-hook-form";
import { useFormTags } from "@/features/tasks/hooks/use-form-tags";
import { zodResolver } from "@hookform/resolvers/zod";

import { validationSchema } from "@/validation/task-schema";

import { Form, Modal, ModalHeader, Input, Button, ChipGroup, CollapsibleSection } from "@/components";
import { Icon } from "@/components/icon";

import { updateTaskAction } from "@/features/tasks/actions";

import { ShareSelect } from "@/features/connections/components/share-select";
import { ShareReadOnlyNote } from "@/features/connections/components/share-readonly-note";

import { SyncWithGoogle } from "../sync-with-google";
import { ReminderFields } from "../reminder-fields";
import { AttachmentsField } from "../../attachments-field";
import { FormData, IEditTaskProps, PRIORITY_OPTIONS } from "../interfaces";

import styles from "./edit-task.module.css";

export function EditTask({ taskBeingEdited, isGoogleConnected, connections }: IEditTaskProps) {
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
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
      tag: taskBeingEdited.tag,
      title: taskBeingEdited.title,
      description: taskBeingEdited.description,
      priority: taskBeingEdited.priority,
      scheduledAt: taskBeingEdited.scheduledAt || "",
      reminderOffsetsMinutes: taskBeingEdited.reminderOffsetsMinutes ?? [],
      recurrence: taskBeingEdited.recurrence,
      sharedWithUserId: taskBeingEdited.sharedWithUserId ?? "",
      syncEnabled: taskBeingEdited.syncEnabled,
    },
  });

  const syncEnabled = useWatch({ control, name: "syncEnabled" });
  const scheduledAt = useWatch({ control, name: "scheduledAt" });
  const priority = useWatch({ control, name: "priority" });

  const closeModal = () => {
    setIsOpen(false);
    reset();
  };

  const handleFormSubmit = async (data: FormData) => {
    setSubmitError(null);

    const result = await updateTaskAction({
      ...data,
      id: taskBeingEdited.id,
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
          "aria-label": `Editar tarefa ${taskBeingEdited.title}`,
          onClick: function () {
            setIsOpen(true);
          },
        }}
      />

      {isOpen && (
        <Modal onClose={closeModal}>
          <ModalHeader title="Editar Tarefa" onClose={closeModal} />

          <Form.Root onSubmit={handleSubmit(handleFormSubmit)}>
            <Form.Wrapper>
              <Input.Root sharedProps={{ error: errors.title?.message }}>
                <Input.Wrapper>
                  <Input.Field
                    className={styles.titleField}
                    {...register("title")}
                    placeholder="O que você precisa fazer?"
                    autoFocus
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

              <Input.Root>
                <Input.Label>Anexos</Input.Label>
                <AttachmentsField taskId={taskBeingEdited.id} />
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
                    <ShareSelect
                      connections={connections}
                      disabled={taskBeingEdited.isSharedWithMe}
                      {...register("sharedWithUserId")}
                    />
                  </Input.Wrapper>

                  <Input.HelperText />
                </Input.Root>

                {taskBeingEdited.isSharedWithMe && (
                  <ShareReadOnlyNote noun="esta tarefa" className={styles.mutedNote} />
                )}

                <SyncWithGoogle
                  register={register}
                  setValue={setValue}
                  isChecked={!!syncEnabled}
                  isGoogleConnected={isGoogleConnected}
                />
              </CollapsibleSection>
            </Form.Wrapper>

            {submitError && <p className={styles.formError}>{submitError}</p>}

            <Button.Root loading={isSubmitting}>Salvar Alterações</Button.Root>
          </Form.Root>
        </Modal>
      )}
    </>
  );
}

"use client";

import { useRef } from "react";
import { useWatch } from "react-hook-form";
import { useFormTags } from "@/features/tasks/hooks/use-form-tags";

import { validationSchema } from "@/validation/task-schema";

import { Alert, Form, Modal, ModalHeader, Input, Button, ChipGroup, CollapsibleSection } from "@/components";
import { Icon } from "@/components/icon";
import modalStyles from "@/components/modal/styles.module.css";

import {
  createTaskStepsAction,
  deleteTaskStepAction,
  reorderTaskStepsAction,
  updateTaskAction,
  updateTaskStepAction,
} from "@/features/tasks/actions";
import { isVagueTaskTitle } from "@/features/tasks/is-vague-title";
import { useTaskStore } from "@/features/tasks/task-store";

import { ShareSelect } from "@/features/connections/components/share-select";
import { ShareReadOnlyNote } from "@/features/connections/components/share-readonly-note";
import { useFormModal } from "@/hooks/use-form-modal";

import { SyncWithGoogle } from "../sync-with-google";
import { ReminderFields } from "../reminder-fields";
import { AttachmentsField } from "../../attachments-field";
import { TaskSteps, TaskStepsDraft } from "../../task-steps";
import { FormData, IEditTaskProps, PRIORITY_OPTIONS } from "../interfaces";

import styles from "./styles.module.css";

export function EditTask({ taskBeingEdited, isGoogleConnected, connections }: IEditTaskProps) {
  const formTags = useFormTags();
  const stepsDraft = useRef<TaskStepsDraft>({
    existingSteps: taskBeingEdited.steps,
    newStepTitles: [],
  });
  const replaceTask = useTaskStore((state) => state.replaceTask);

  const {
    register,
    setValue,
    control,
    formState: { errors, isSubmitting },
    isOpen,
    openModal,
    closeModal,
    submitError,
    handleFormSubmit,
  } = useFormModal<FormData>({
    schema: validationSchema,
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
    onSubmit: async (data) => {
      const taskResult = await updateTaskAction({ ...data, id: taskBeingEdited.id });
      if (taskResult.error) return taskResult;

      const draft = stepsDraft.current;
      const originalStepsById = new Map(taskBeingEdited.steps.map((step) => [step.id, step]));

      for (const step of draft.existingSteps) {
        const originalStep = originalStepsById.get(step.id);
        if (!originalStep) continue;
        if (originalStep.title !== step.title || originalStep.completed !== step.completed) {
          const stepResult = await updateTaskStepAction({
            id: step.id,
            ...(originalStep.title !== step.title ? { title: step.title } : {}),
            ...(originalStep.completed !== step.completed ? { completed: step.completed } : {}),
          });
          if (stepResult.error) return stepResult;
        }
      }

      const draftStepIds = new Set(draft.existingSteps.map((step) => step.id));
      for (const step of taskBeingEdited.steps) {
        if (!draftStepIds.has(step.id)) {
          const stepResult = await deleteTaskStepAction({ id: step.id });
          if (stepResult.error) return stepResult;
        }
      }

      const titles = draft.newStepTitles;
      const stepResult = await createTaskStepsAction({
        taskId: taskBeingEdited.id,
        titles,
      });
      if (stepResult.error) return stepResult;

      const orderedStepIds = [...draft.existingSteps.map((step) => step.id), ...(stepResult.ids ?? [])];
      if (orderedStepIds.length > 0) {
        const reorderResult = await reorderTaskStepsAction({ taskId: taskBeingEdited.id, orderedStepIds });
        if (reorderResult.error) return reorderResult;
      }

      const currentTask = useTaskStore.getState().tasks.find((task) => task.id === taskBeingEdited.id) ?? taskBeingEdited;
      replaceTask({
        ...currentTask,
        ...data,
        scheduledAt: data.scheduledAt || undefined,
        sharedWithUserId: data.sharedWithUserId || null,
        steps: [
          ...draft.existingSteps.map((step, order) => ({ ...step, order })),
          ...titles.flatMap((title, index) => {
            const id = stepResult.ids?.[index];
            return id ? [{ id, taskId: taskBeingEdited.id, title, completed: false, order: draft.existingSteps.length + index }] : [];
          }),
        ],
      });

      return { error: null };
    },
    onSuccess: () => {},
  });

  const syncEnabled = useWatch({ control, name: "syncEnabled" });
  const scheduledAt = useWatch({ control, name: "scheduledAt" });
  const priority = useWatch({ control, name: "priority" });
  const title = useWatch({ control, name: "title" });

  return (
    <>
      <Button.Preset
        icon={{ name: "FaEdit" }}
        root={{
          tone: "highlight",
          "aria-label": `Editar tarefa ${taskBeingEdited.title}`,
          onClick: openModal,
        }}
      />

      {isOpen && (
        <Modal onClose={closeModal} className={modalStyles.wide}>
          <ModalHeader title="Editar Tarefa" onClose={closeModal} />

          <Form.Root onSubmit={handleFormSubmit}>
            <Form.Wrapper>
              <Input.Root sharedProps={{ error: errors.title?.message }}>
                <Input.Label htmlFor="title">Título</Input.Label>

                <Input.Wrapper>
                  <Input.Field
                    className={styles.titleField}
                    {...register("title")}
                    placeholder="O que você precisa fazer?"
                    autoFocus
                  />
                </Input.Wrapper>

                {isVagueTaskTitle(title) && (
                  <p className={styles.vagueHint}>
                    Que tal detalhar um pouco mais? Você também pode quebrar em passos menores
                    depois de criar.
                  </p>
                )}

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
                <Input.Label htmlFor="tag">
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

              <Input.Root>
                <Input.Label>
                  <Icon name="FaListUl" size={12} /> Passos
                </Input.Label>
                <TaskSteps
                  steps={taskBeingEdited.steps}
                  onDraftChange={(draft) => {
                    stepsDraft.current = draft;
                  }}
                />
              </Input.Root>

              <CollapsibleSection label="Mais opções">
                <ReminderFields
                  register={register}
                  setValue={setValue}
                  scheduledAtError={errors.scheduledAt?.message}
                  hasScheduledAt={!!scheduledAt}
                />

                <Input.Root sharedProps={{ error: errors.sharedWithUserId?.message }}>
                  <Input.Label htmlFor="sharedWithUserId">Compartilhar com</Input.Label>

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

                {/* Movido pra dentro de "Mais opções" (era visível sempre) -
                    anexar é uma ação opcional/secundária, não algo que
                    toda edição de tarefa precisa (achado relatado: modal
                    de tarefa com informação demais visível de cara). Um
                    anexo já existente continua totalmente visível e
                    gerenciável (`AttachmentsField` busca e lista os
                    arquivos normalmente) - só precisa de 1 clique em
                    "Mais opções" pra aparecer, mesmo padrão que
                    "Compartilhar com" já usa aqui pra mostrar quem já
                    tem acesso. */}
                <Input.Root>
                  <Input.Label>Anexos</Input.Label>
                  <AttachmentsField taskId={taskBeingEdited.id} />
                </Input.Root>
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

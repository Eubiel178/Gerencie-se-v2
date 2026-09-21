"use client";

import { useRef } from "react";

import { useWatch } from "react-hook-form";

import {
  Alert,
  Form,
  Input,
  Modal,
  ModalHeader,
  Button,
  ChipGroup,
  CollapsibleSection,
} from "@/components";
import { Icon } from "@/components/icon";
import modalStyles from "@/components/modal/styles.module.css";
import { ShareSelect } from "@/features/connections/components/share-select";
import {
  createTaskAction,
  createTaskStepsAction,
} from "@/features/tasks/actions";
import { useFormTags } from "@/features/tasks/hooks/use-form-tags";
import { isVagueTaskTitle } from "@/features/tasks/is-vague-title";
import { useTaskStore } from "@/features/tasks/task-store";
import { useFormModal } from "@/hooks/use-form-modal";
import { validationSchema } from "@/validation/task-schema";

import { TaskSteps, TaskStepsDraft } from "../../task-steps";
import { FormData, IAddTaskProps, PRIORITY_OPTIONS } from "../interfaces";
import { ReminderFields } from "../reminder-fields";
import { SyncWithGoogle } from "../sync-with-google";


import styles from "./styles.module.css";

export function AddTask({
  buttonText,
  isGoogleConnected,
  connections,
}: IAddTaskProps) {
  const formTags = useFormTags();
  const addTask = useTaskStore((state) => state.addTask);
  const stepsDraft = useRef<TaskStepsDraft>({
    existingSteps: [],
    newStepTitles: [],
  });

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
  } = useFormModal<FormData, Awaited<ReturnType<typeof createTaskAction>>>({
    schema: validationSchema,
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
    onSubmit: async (data) => {
      const result = await createTaskAction(data);
      if (result.error || !result.task) return result;
      const createdTask = result.task;
      const titles = stepsDraft.current.newStepTitles;
      const stepsResult = await createTaskStepsAction({
        taskId: createdTask.id,
        titles,
      });
      if (stepsResult.error) return stepsResult;
      stepsDraft.current = { existingSteps: [], newStepTitles: [] };
      return {
        ...result,
        task: {
          ...createdTask,
          steps: [
            ...createdTask.steps,
            ...titles.flatMap((title, index) => {
              const id = stepsResult.ids?.[index];
              return id
                ? [
                    {
                      id,
                      taskId: createdTask.id,
                      title,
                      completed: false,
                      order: createdTask.steps.length + index,
                    },
                  ]
                : [];
            }),
          ],
        },
      };
    },
    onSuccess: (result) => {
      if (result.task) addTask(result.task);
    },
  });

  const syncEnabled = useWatch({ control, name: "syncEnabled" });
  const scheduledAt = useWatch({ control, name: "scheduledAt" });
  const priority = useWatch({ control, name: "priority" });
  const title = useWatch({ control, name: "title" });

  return (
    <>
      <Button.Root type="button" data-tour="new-task" onClick={openModal}>
        {buttonText}
      </Button.Root>

      {isOpen && (
        <Modal onClose={closeModal} className={modalStyles.wide}>
          <ModalHeader title="Nova Tarefa" onClose={closeModal} />

          <Form.Root onSubmit={handleFormSubmit}>
            <Form.Wrapper>
              <Input.Root sharedProps={{ error: errors.title?.message }}>
                <Input.Label htmlFor="title">Título</Input.Label>

                <Input.Wrapper>
                  <Input.Field
                    autoFocus
                    className={styles.titleField}
                    {...register("title")}
                    placeholder="O que você precisa fazer?"
                  />
                </Input.Wrapper>

                {isVagueTaskTitle(title) && (
                  <p className={styles.vagueHint}>
                    Que tal detalhar um pouco mais? Você também pode quebrar em
                    passos menores depois de criar.
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
                  onChange={(value) =>
                    setValue("priority", value as FormData["priority"], {
                      shouldValidate: true,
                    })
                  }
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
                  <Icon name="FaListUl" size={12} /> Passos (opcional)
                </Input.Label>
                <TaskSteps
                  steps={[]}
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

                <Input.Root
                  sharedProps={{ error: errors.sharedWithUserId?.message }}
                >
                  <Input.Label htmlFor="sharedWithUserId">
                    Compartilhar com
                  </Input.Label>

                  <Input.Wrapper>
                    <ShareSelect
                      connections={connections}
                      {...register("sharedWithUserId")}
                    />
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

            {submitError && <Alert variant="error">{submitError}</Alert>}

            <Button.Root loading={isSubmitting}>Adicionar Tarefa</Button.Root>
          </Form.Root>
        </Modal>
      )}
    </>
  );
}

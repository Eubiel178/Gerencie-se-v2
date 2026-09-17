"use client";

import { validationSchema } from "@/validation/routine-schema";

import { Alert, Form, Modal, ModalHeader, Input, Button, SuggestionChips, CollapsibleSection } from "@/components";
import { Icon } from "@/components/icon";
import modalStyles from "@/components/modal/styles.module.css";

import { updateRoutineItemAction } from "@/features/routine/actions";
import { ShareSelect } from "@/features/connections/components/share-select";
import { ShareReadOnlyNote } from "@/features/connections/components/share-readonly-note";
import { useFormModal } from "@/hooks/use-form-modal";

import { FormData, IEditRoutineItemProps, NO_TASK_VALUE } from "../interfaces";

import styles from "./edit-routine-item.module.css";

const TITLE_SUGGESTIONS = ["Acordar", "Café da manhã", "Estudar", "Exercício", "Dormir"];
const TIME_SUGGESTIONS = ["07:00", "12:00", "18:00", "22:00"];

export function EditRoutineItem({ itemBeingEdited, taskOptions, connections }: IEditRoutineItemProps) {
  const {
    register,
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
      time: itemBeingEdited.time,
      title: itemBeingEdited.title,
      taskId: itemBeingEdited.taskId || NO_TASK_VALUE,
      sharedWithUserId: itemBeingEdited.sharedWithUserId ?? "",
    },
    onSubmit: (data) =>
      updateRoutineItemAction({
        id: itemBeingEdited.id,
        time: data.time,
        title: data.title,
        taskId: data.taskId === NO_TASK_VALUE ? null : data.taskId,
        sharedWithUserId: data.sharedWithUserId,
      }),
  });

  return (
    <>
      <Button.Preset
        icon={{ name: "FaEdit" }}
        root={{
          tone: "highlight",
          "aria-label": `Editar item de rotina ${itemBeingEdited.title}`,
          onClick: openModal,
        }}
      />

      {isOpen && (
        <Modal onClose={closeModal} className={modalStyles.medium}>
          <ModalHeader title="Editar Item de Rotina" onClose={closeModal} />

          <Form.Root onSubmit={handleFormSubmit}>
            <Form.Wrapper>
              <Input.Root sharedProps={{ error: errors.title?.message }}>
                <Input.Label htmlFor="title">Título</Input.Label>

                <Input.Wrapper>
                  <Input.Field
                    className={styles.titleField}
                    {...register("title")}
                    placeholder="O que faz parte da sua rotina?"
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

              <Input.Root sharedProps={{ error: errors.time?.message }}>
                <Input.Label htmlFor="time">
                  <Icon name="MdTimer" size={13} /> Horário
                </Input.Label>

                <Input.Wrapper>
                  <Input.Field {...register("time")} type="time" />
                </Input.Wrapper>

                <SuggestionChips
                  label="Horários comuns"
                  suggestions={TIME_SUGGESTIONS}
                  onSelect={(value) => setValue("time", value, { shouldValidate: true })}
                />

                <Input.HelperText />
              </Input.Root>

              <CollapsibleSection label="Mais opções">
                {taskOptions.length > 0 && (
                  <Input.Root>
                    <Input.Label htmlFor="taskId">Vincular a uma tarefa (opcional)</Input.Label>

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
                  <Input.Label htmlFor="sharedWithUserId">Compartilhar com</Input.Label>

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

"use client";


import { Alert, Form, Input, Modal, ModalHeader, Button, SuggestionChips, CollapsibleSection } from "@/components";
import { Icon } from "@/components/icon";
import modalStyles from "@/components/modal/styles.module.css";
import { ShareSelect } from "@/features/connections/components/share-select";
import { createRoutineItemAction } from "@/features/routine/actions";
import { useFormModal } from "@/hooks/use-form-modal";
import { nowForTimeInput } from "@/utils";
import { validationSchema } from "@/validation/routine-schema";

import { FormData, IAddRoutineItemProps, NO_TASK_VALUE } from "../interfaces";

import styles from "./styles.module.css";

const TITLE_SUGGESTIONS = ["Acordar", "Café da manhã", "Estudar", "Exercício", "Dormir"];
const TIME_SUGGESTIONS = ["07:00", "12:00", "18:00", "22:00"];

function emptyFormValues(): FormData {
  return { time: nowForTimeInput(), title: "", taskId: NO_TASK_VALUE, sharedWithUserId: "" };
}

export function AddRoutineItem({ buttonText, taskOptions, connections }: IAddRoutineItemProps) {
  const {
    reset,
    register,
    setValue,
    formState: { errors, isSubmitting },
    isOpen,
    openModal: openModalBase,
    closeModal,
    submitError,
    handleFormSubmit,
  } = useFormModal<FormData>({
    schema: validationSchema,
    defaultValues: emptyFormValues(),
    onSubmit: (data) =>
      createRoutineItemAction({
        time: data.time,
        title: data.title,
        taskId: data.taskId === NO_TASK_VALUE ? null : data.taskId,
        sharedWithUserId: data.sharedWithUserId,
      }),
  });

  // `time` precisa ser reiniciado pro horário ATUAL a cada abertura (não
  // só no mount) — diferente dos outros campos, "agora" muda a cada vez.
  function openModal() {
    reset(emptyFormValues());
    openModalBase();
  }

  return (
    <>
      <Button.Root type="button" onClick={openModal}>
        {buttonText}
      </Button.Root>

      {isOpen && (
        <Modal onClose={closeModal} className={modalStyles.medium}>
          <ModalHeader title="Novo Item de Rotina" onClose={closeModal} />

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
                    <ShareSelect connections={connections} {...register("sharedWithUserId")} />
                  </Input.Wrapper>

                  <Input.HelperText />
                </Input.Root>
              </CollapsibleSection>
            </Form.Wrapper>

            {submitError && <Alert variant="error">{submitError}</Alert>}

            <Button.Root loading={isSubmitting}>Adicionar à Rotina</Button.Root>
          </Form.Root>
        </Modal>
      )}
    </>
  );
}

"use client";

import dayjs from "dayjs";

import { validationSchema } from "@/validation/event-schema";

import { Alert, Form, Input, Modal, ModalHeader, Button, SuggestionChips, CollapsibleSection } from "@/components";
import { Icon } from "@/components/icon";
import inputStyles from "@/components/form/input/styles.module.css";

import { createEventAction } from "@/features/events/actions";
import { nowForDatetimeLocal } from "@/utils";
import { useFormModal } from "@/hooks/use-form-modal";

import { FormData, IModalProps } from "./interfaces";

import styles from "./add-event.module.css";

const EVENT_COLORS = [
  "#3788d8",
  "#e11d48",
  "#16a34a",
  "#f59e0b",
  "#8b5cf6",
  "#0891b2",
  "#64748b",
];

const DURATION_SHORTCUTS = [
  { label: "+30min", minutes: 30 },
  { label: "+1h", minutes: 60 },
  { label: "+2h", minutes: 120 },
];

function emptyFormValues(): FormData {
  return {
    title: "",
    description: "",
    start: nowForDatetimeLocal(),
    end: "",
    url: "",
    backgroundColor: "#3788d8",
  };
}

export const AddEvent = ({ buttonText }: IModalProps) => {
  const {
    formState: { errors, isSubmitting },
    register,
    reset,
    setValue,
    watch,
    isOpen,
    openModal: openModalBase,
    closeModal,
    submitError,
    handleFormSubmit,
  } = useFormModal<FormData>({
    schema: validationSchema,
    defaultValues: emptyFormValues(),
    onSubmit: (data) => createEventAction(data),
  });

  const start = watch("start");
  const backgroundColor = watch("backgroundColor");

  // `start` precisa ser reiniciado pro horário ATUAL a cada abertura (não
  // só no mount) — diferente dos outros campos, "agora" muda a cada vez.
  function openModal() {
    reset(emptyFormValues());
    openModalBase();
  }

  return (
    <>
      <Button.Root onClick={openModal}>{buttonText}</Button.Root>

      {isOpen && (
        <Modal onClose={closeModal}>
          <ModalHeader title="Novo Evento" onClose={closeModal} />

          <Form.Root onSubmit={handleFormSubmit}>
            <Form.Wrapper className={styles.formWrapper}>
              <Input.Root sharedProps={{ error: errors.title?.message }}>
                <Input.Wrapper>
                  <Input.Field
                    className={styles.titleField}
                    {...register("title")}
                    placeholder="Nome do evento"
                    autoFocus
                  />
                </Input.Wrapper>

                <Input.HelperText />
              </Input.Root>

              <Input.Root sharedProps={{ error: errors.start?.message }}>
                <Input.Label htmlFor="start">
                  <Icon name="FaCalendarAlt" size={12} /> Início
                </Input.Label>
                <Input.Wrapper>
                  <Input.Field
                    {...register("start")}
                    type="datetime-local"
                  />
                </Input.Wrapper>

                <Input.HelperText />
              </Input.Root>

              <Input.Root sharedProps={{ error: errors.end?.message }}>
                <Input.Label htmlFor="end">Fim (opcional)</Input.Label>
                <Input.Wrapper>
                  <Input.Field
                    {...register("end")}
                    type="datetime-local"
                  />
                </Input.Wrapper>

                <SuggestionChips
                  label="Duração até o fim"
                  suggestions={DURATION_SHORTCUTS.map((shortcut) => shortcut.label)}
                  onSelect={(label) => {
                    const shortcut = DURATION_SHORTCUTS.find((option) => option.label === label);
                    if (!shortcut || !start) return;
                    setValue(
                      "end",
                      dayjs(start).add(shortcut.minutes, "minute").format("YYYY-MM-DDTHH:mm"),
                      { shouldValidate: true }
                    );
                  }}
                />

                <Input.HelperText />
              </Input.Root>

              <Input.Root
                sharedProps={{ error: errors.backgroundColor?.message }}
              >
                <Input.Label htmlFor="backgroundColor">
                  Cor do marcador
                </Input.Label>

                <div className={styles.colorSwatches} role="group" aria-label="Cores prontas">
                  {EVENT_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={styles.colorSwatch}
                      data-selected={backgroundColor === color}
                      style={{ backgroundColor: color }}
                      aria-label={`Usar a cor ${color}`}
                      onClick={() => setValue("backgroundColor", color, { shouldValidate: true })}
                    />
                  ))}

                  <Input.Field
                    {...register("backgroundColor")}
                    className={`${inputStyles.colorField} ${styles.customColorField}`}
                    type="color"
                    aria-label="Escolher outra cor"
                  />
                </div>

                <Input.HelperText />
              </Input.Root>

              <CollapsibleSection label="Mais opções">
                <Input.Root sharedProps={{ error: errors.description?.message }}>
                  <Input.Label htmlFor="description">
                    <Icon name="FaAlignLeft" size={12} /> Descrição
                  </Input.Label>
                  <Input.Wrapper>
                    <Input.Field
                      {...register("description")}
                      placeholder="Detalhes (opcional)"
                    />
                  </Input.Wrapper>

                  <Input.HelperText />
                </Input.Root>

                <Input.Root sharedProps={{ error: errors.url?.message }}>
                  <Input.Label htmlFor="url">Link (opcional)</Input.Label>
                  <Input.Wrapper>
                    <Input.Field
                      {...register("url")}
                      type="url"
                      placeholder="https://..."
                    />
                  </Input.Wrapper>

                  <Input.HelperText />
                </Input.Root>
              </CollapsibleSection>
            </Form.Wrapper>

            {submitError && <Alert variant="error">{submitError}</Alert>}

            <Button.Root loading={isSubmitting}>Adicionar Evento</Button.Root>
          </Form.Root>
        </Modal>
      )}
    </>
  );
};

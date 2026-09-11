"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { useForm } from "react-hook-form";
import { FaEdit } from "@/components/icon";
import { zodResolver } from "@hookform/resolvers/zod";

import { validationSchema } from "@/validation/event-schema";

import { Form, Modal, ModalHeader, Input, Button } from "@/components";
import inputStyles from "@/components/form/input/styles.module.css";

import { updateEventAction } from "@/features/events/actions";
import { useEventStore } from "@/features/events/event-store";

import { FormData, IModalProps } from "./interfaces";

import styles from "./edit-event.module.css";

export const EditEvent = ({ eventBeingEdited }: IModalProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const router = useRouter();
  const replaceEvent = useEventStore((state) => state.replaceEvent);

  const {
    handleSubmit,
    formState: { errors, isSubmitting },
    register,
    reset,
  } = useForm<FormData>({
    mode: "onChange",
    resolver: zodResolver(validationSchema),
    defaultValues: {
      title: eventBeingEdited.title,
      description: eventBeingEdited.description,
      start: eventBeingEdited.start,
      end: eventBeingEdited.end,
      url: eventBeingEdited.url,
      backgroundColor: eventBeingEdited.backgroundColor || "#3788d8",
    },
  });

  function closeModal() {
    setIsOpen(false);
  }

  async function handleFormSubmit(data: FormData) {
    setSubmitError(null);

    const updatedEvent = { ...eventBeingEdited, ...data };
    const result = await updateEventAction(updatedEvent);

    if (result.error) {
      setSubmitError(result.error);
      return;
    }

    replaceEvent(updatedEvent);
    closeModal();
    router.refresh();
  }

  return (
    <>
      <Button.IconButtonPreset
        icon={FaEdit}
        tone="muted"
        aria-label={`Editar evento ${eventBeingEdited.title}`}
        onClick={function () {
          setIsOpen(true);
        }}
      />

      {isOpen && (
        <Modal>
          <ModalHeader title="Editando Evento" onClose={closeModal} />

          <Form.Root onSubmit={handleSubmit(handleFormSubmit)}>
            <Form.Wrapper>
              <Input.Root sharedProps={{ error: errors.title?.message }}>
                <Input.Wrapper>
                  <Input.Field
                    {...register("title")}
                    placeholder="Nome do Evento"
                  />
                </Input.Wrapper>

                <Input.HelperText />
              </Input.Root>

              <Input.Root sharedProps={{ error: errors.description?.message }}>
                <Input.Wrapper>
                  <Input.Field
                    {...register("description")}
                    placeholder="Descrição do Evento"
                  />
                </Input.Wrapper>

                <Input.HelperText />
              </Input.Root>

              <Input.Root sharedProps={{ error: errors.start?.message }}>
                <Input.Wrapper>
                  <Input.Field
                    {...register("start")}
                    type="datetime-local"
                    placeholder="Data e Hora inicial do evento"
                  />
                </Input.Wrapper>

                <Input.HelperText />
              </Input.Root>

              <Input.Root sharedProps={{ error: errors.end?.message }}>
                <Input.Wrapper>
                  <Input.Field
                    {...register("end")}
                    type="datetime-local"
                    placeholder="Data e Hora final do evento(opcional)"
                  />
                </Input.Wrapper>

                <Input.HelperText />
              </Input.Root>

              <Input.Root sharedProps={{ error: errors.url?.message }}>
                <Input.Wrapper>
                  <Input.Field
                    {...register("url")}
                    type="url"
                    placeholder="Link do evento(opcional)"
                  />
                </Input.Wrapper>

                <Input.HelperText />
              </Input.Root>

              <Input.Root
                sharedProps={{ error: errors.backgroundColor?.message }}
              >
                <Input.Label htmlFor="backgroundColor">
                  Cor do marcador do evento
                </Input.Label>

                <Input.Wrapper>
                  <Input.Field
                    {...register("backgroundColor")}
                    className={inputStyles.colorField}
                    type="color"
                  />
                </Input.Wrapper>

                <Input.HelperText />
              </Input.Root>
            </Form.Wrapper>

            {submitError && <p className={styles.formError}>{submitError}</p>}

            <Button.Root loading={isSubmitting}>Salvar Alterações</Button.Root>
          </Form.Root>
        </Modal>
      )}
    </>
  );
};

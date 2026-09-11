"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";

import { validationSchema } from "@/validation/event-schema";

import { Form, Input, Modal, ModalHeader, Button } from "@/components";
import inputStyles from "@/components/form/input/styles.module.css";

import { createEventAction } from "@/features/events/actions";

import { FormData, IModalProps } from "./interfaces";

import styles from "./add-event.module.css";

// Formato exigido por <input type="datetime-local">: "AAAA-MM-DDTHH:mm".
function nowForDatetimeLocal(): string {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");

  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

export const AddEvent = ({ buttonText }: IModalProps) => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    handleSubmit,
    formState: { errors, isSubmitting },
    register,
    reset,
  } = useForm<FormData>({
    mode: "onChange",
    resolver: zodResolver(validationSchema),
    defaultValues: {
      title: "",
      description: "",
      start: nowForDatetimeLocal(),
      end: "",
      url: "",
      backgroundColor: "#3788d8",
    },
  });

  const handleFormSubmit = async (data: FormData) => {
    setSubmitError(null);

    const result = await createEventAction(data);

    if (result.error) {
      setSubmitError(result.error);
      return;
    }

    reset();
    closeModal();
    router.refresh();
  };

  const closeModal = () => {
    setIsOpen(false);
    reset();
  };

  function openModal() {
    reset({
      title: "",
      description: "",
      start: nowForDatetimeLocal(),
      end: "",
      url: "",
      backgroundColor: "#3788d8",
    });
    setIsOpen(true);
  }

  return (
    <>
      <Button.Root onClick={openModal}>{buttonText}</Button.Root>

      {isOpen && (
        <Modal onClose={closeModal}>
          <ModalHeader title="Novo Evento" onClose={closeModal} />

          <Form.Root onSubmit={handleSubmit(handleFormSubmit)}>
            <Form.Wrapper className={styles.formWrapper}>
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

            <Button.Root loading={isSubmitting}>Novo Evento</Button.Root>
          </Form.Root>
        </Modal>
      )}
    </>
  );
};

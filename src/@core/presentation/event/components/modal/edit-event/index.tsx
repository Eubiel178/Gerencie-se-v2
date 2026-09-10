"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { useForm } from "react-hook-form";
import { MdClose } from "react-icons/md";
import { FaEdit } from "react-icons/fa";
import { zodResolver } from "@hookform/resolvers/zod";

import { validationSchema } from "@/validation/event-schema";

import { Form, Modal, Input, Button, Wrapper, Feedback } from "@/components";

import { updateEventAction } from "@/features/events/actions";

import { FormData, IModalProps } from "./interfaces";

export const EditEvent = ({ eventBeingEdited }: IModalProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const router = useRouter();

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
    // TODO(fase 7 — Zustand): trocar por update otimista assim que a store
    // de eventos existir; hoje o `router.refresh()` refaz o fetch no server.
    setSubmitError(null);

    const result = await updateEventAction({ ...eventBeingEdited, ...data });

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
        color="secondary"
        background="transparent"
        size="xlarge"
        aria-label={`Editar evento ${eventBeingEdited.title}`}
        onClick={function () {
          setIsOpen(true);
        }}
      >
        <FaEdit />
      </Button>

      {isOpen && (
        <Modal>
          <Wrapper justify="between" align="center">
            <h3>Editando Evento</h3>

            <Button
              background="transparent"
              color="secondary"
              size="xlarge"
              aria-label="Fechar"
              onClick={closeModal}
            >
              <MdClose />
            </Button>
          </Wrapper>

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
                    className="p-[0px] px-1 h-10"
                    type="color"
                  />
                </Input.Wrapper>

                <Input.HelperText>
                  {errors.backgroundColor?.message}
                </Input.HelperText>
              </Input.Root>
            </Form.Wrapper>

            {submitError && <Feedback>{submitError}</Feedback>}

            <Button loading={isSubmitting}>Salvar Alterações</Button>
          </Form.Root>
        </Modal>
      )}
    </>
  );
};

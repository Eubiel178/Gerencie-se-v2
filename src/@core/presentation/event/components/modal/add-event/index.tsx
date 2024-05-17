"use client";

import { useState } from "react";

import { useForm } from "react-hook-form";
import { MdClose } from "react-icons/md";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEvent } from "@/@core/presentation/hooks";

import { validationSchema } from "@/validation/eventSchema";

import { Form, Input, Modal, Button, Wrapper } from "@/components";

import { FormData, IModalProps } from "./interfaces";

export const AddEvent = ({ buttonText }: IModalProps) => {
  const { fetcher } = useEvent();
  const [isOpen, setIsOpen] = useState(false);

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
      start: "",
      end: "",
      url: "",
      backgroundColor: "#3788d8",
    },
  });

  const handleFormSubmit = (data: FormData) => {
    const response = fetcher.create(data);

    reset();
  };

  const closeModal = () => {
    setIsOpen(false);
    reset();
  };

  return (
    <>
      <Button
        onClick={function () {
          setIsOpen(true);
        }}
      >
        {buttonText}
      </Button>

      {isOpen && (
        <Modal>
          <Wrapper justify="between" align="center">
            <h3>Novo Evento</h3>

            <Button
              background="transparent"
              color="secondary"
              size="xlarge"
              onClick={closeModal}
            >
              <MdClose />
            </Button>
          </Wrapper>

          <Form.Root onSubmit={handleSubmit(handleFormSubmit)}>
            <Form.Wrapper gap="small">
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

            <Button loading={isSubmitting}>Novo Evento</Button>
          </Form.Root>
        </Modal>
      )}
    </>
  );
};

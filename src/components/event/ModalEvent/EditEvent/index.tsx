"use client";

import { useEventListContext } from "@/providers/EventListContext";

import { tv } from "tailwind-variants";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { validationSchema } from "@/validation/eventSchema";

import { MdClose } from "react-icons/md";

import { Input, TitleTwo, Form, Button, Wrapper } from "@/components/_ui";
import { EventType } from "@/services/event";

const styles = tv({
  base: "fixed z-10 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-100 border-solid border-2 border-gray-300",
});

type FormData = EventType & z.infer<typeof validationSchema>;

export const EditEvent = () => {
  const { eventBeingEdited, setEventBeingEdited, handleEventEdit } =
    useEventListContext();

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
      backgroundColor: "#3788d8",
    },
  });

  const closeModal = () => {
    setEventBeingEdited({
      id: "",
      title: "",
      description: "",
      start: "",
      end: "",
      url: "",
      backgroundColor: "",
    });
  };

  const handleFormSubmit = (data: FormData) => {
    handleEventEdit(data);

    reset({
      title: "",
      description: "",
      start: "",
      end: "",
      url: "",
      backgroundColor: "#3788d8",
    });

    closeModal();
  };

  return (
    <Wrapper
      direction="column"
      gap="large"
      padding="medium"
      shadow="large"
      className={styles()}
    >
      <Wrapper justify="between" align="center">
        <TitleTwo>Editando Evento</TitleTwo>

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

          <Input.Root sharedProps={{ error: errors.backgroundColor?.message }}>
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

        <Button loading={isSubmitting}>Salvar</Button>
      </Form.Root>
    </Wrapper>
  );
};

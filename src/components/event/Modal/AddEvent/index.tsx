"use client";

import { useEventListContext } from "@/providers/EventListContext";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { validationSchema } from "@/validation/eventSchema";
import { MdClose } from "react-icons/md";

import {
  Input,
  TitleTwo,
  Form,
  Button,
  Wrapper,
  Modal,
} from "@/components/_ui";

type FormData = z.infer<typeof validationSchema>;

export const AddEvent = () => {
  const { handleEventCreate, isOpenModal, setIsOpenModal } =
    useEventListContext();
  const defaultValues = {
    title: "",
    description: "",
    start: "",
    end: "",
    url: "",
    backgroundColor: "#3788d8",
  };

  const {
    handleSubmit,
    formState: { errors, isSubmitting },
    register,
    reset,
  } = useForm<FormData>({
    mode: "onChange",
    resolver: zodResolver(validationSchema),
    defaultValues: defaultValues,
  });

  const resetFields = () => {
    reset(defaultValues);
  };

  const handleFormSubmit = (data: FormData) => {
    handleEventCreate(data);

    resetFields();
  };

  return (
    <>
      {isOpenModal && (
        <Modal>
          <Wrapper justify="between" align="center">
            <TitleTwo>Novo Evento</TitleTwo>

            <Button
              background="transparent"
              color="secondary"
              size="xlarge"
              onClick={() => {
                setIsOpenModal(false);
                resetFields();
              }}
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

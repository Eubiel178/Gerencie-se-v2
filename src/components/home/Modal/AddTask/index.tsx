"use client";

import { useTaskListContext } from "@/providers/TasksListContext";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { validationSchema } from "@/validation/taskSchema";
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

export const AddTask = () => {
  const { handleTaskCreation, isOpenModal, setIsOpenModal } =
    useTaskListContext();

  const {
    handleSubmit,
    formState: { errors, isSubmitting },
    register,
    reset,
  } = useForm<FormData>({
    mode: "onChange",
    resolver: zodResolver(validationSchema),
    defaultValues: {
      tag: "other",
      title: "",
      description: "",
    },
  });

  const listTaskTypes = [
    { label: "Estudo", value: "studie" },
    { label: "Trabalho", value: "work" },
    { label: "Exercício", value: "exercise" },
    { label: "Outros", value: "other" },
  ];

  const closeModal = () => {
    setIsOpenModal(false);
    reset();
  };

  const handleFormSubmit = (data: FormData) => {
    handleTaskCreation(data);

    closeModal();
  };

  return (
    <>
      {isOpenModal && (
        <Modal>
          <Wrapper justify="between" align="center">
            <TitleTwo>Nova Tarefa</TitleTwo>

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
            <Form.Wrapper gap="xsmall">
              <Input.Root sharedProps={{ error: errors.tag?.message }}>
                <Input.Label>Tipo de Tarefa</Input.Label>

                <Input.Wrapper>
                  <Input.FieldSelect
                    {...register("tag")}
                    optionsArray={listTaskTypes}
                  />
                </Input.Wrapper>

                <Input.HelperText />
              </Input.Root>

              <Input.Root sharedProps={{ error: errors.title?.message }}>
                <Input.Wrapper>
                  <Input.Field
                    {...register("title")}
                    placeholder="Título da Tarefa"
                  />
                </Input.Wrapper>

                <Input.HelperText />
              </Input.Root>

              <Input.Root sharedProps={{ error: errors.description?.message }}>
                <Input.Wrapper>
                  <Input.FieldTextarea
                    {...register("description")}
                    rows={5}
                    placeholder="Descrição da Tarefa"
                  />
                </Input.Wrapper>

                <Input.HelperText />
              </Input.Root>
            </Form.Wrapper>

            <Button loading={isSubmitting}>Nova Tarefa</Button>
          </Form.Root>
        </Modal>
      )}
    </>
  );
};

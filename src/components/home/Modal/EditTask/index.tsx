"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { MdClose } from "react-icons/md";

import { useTaskListContext } from "@/providers/TasksListContext";
import { validationSchema } from "@/validation/taskSchema";
import { TaskType } from "@/services/task";

import {
  Input,
  TitleTwo,
  Form,
  Button,
  Wrapper,
  Modal,
} from "@/components/_ui";

type FormData = TaskType & z.infer<typeof validationSchema>;

export const EditTask = () => {
  const { handleTaskEditing, taskBeingEdited, setTaskBeingEdited } =
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
      tag: taskBeingEdited.tag,
      title: taskBeingEdited.title,
      description: taskBeingEdited.description,
    },
  });

  const listTaskTypes = [
    { label: "Estudo", value: "studie" },
    { label: "Trabalho", value: "work" },
    { label: "Exercício", value: "exercise" },
    { label: "Outros", value: "other" },
  ];

  const closeModal = () => {
    setTaskBeingEdited({
      id: "",
      tag: "",
      title: "",
      description: "",
    });

    reset();
  };

  const handleFormSubmit = (data: FormData) => {
    handleTaskEditing(data);

    closeModal();
  };

  return (
    <Modal>
      <Wrapper justify="between" align="center">
        <TitleTwo>Editar Tarefa</TitleTwo>

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
                className="max-h-40"
                rows={5}
                placeholder="Descrição da Tarefa"
              />
            </Input.Wrapper>

            <Input.HelperText />
          </Input.Root>
        </Form.Wrapper>

        <Button loading={isSubmitting}>Salvar Alterações</Button>
      </Form.Root>
    </Modal>
  );
};

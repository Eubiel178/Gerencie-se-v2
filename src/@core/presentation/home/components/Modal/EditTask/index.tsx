"use client";

import { MdClose } from "react-icons/md";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { validationSchema } from "@/validation/taskSchema";

import { Form, Modal, Input, Button, Wrapper } from "@/components/_ui";

import { FormData, IModalProps } from "./interfaces";

export function EditTask({ open, setOpen, taskBeingEdited }: IModalProps) {
  const {
    handleSubmit,
    formState: { errors, isSubmitting },
    register,
    reset,
  } = useForm<FormData>({
    mode: "onChange",
    resolver: zodResolver(validationSchema),
    defaultValues: {
      ...taskBeingEdited,
    },
  });

  const listTaskTypes = [
    { label: "Estudo", value: "studie" },
    { label: "Trabalho", value: "work" },
    { label: "Exercício", value: "exercise" },
    { label: "Outros", value: "other" },
  ];

  const closeModal = () => {
    reset();
  };

  const handleFormSubmit = (data: FormData) => {
    closeModal();
  };

  return (
    <Modal>
      <Wrapper justify="between" align="center">
        <h3>Editar Tarefa</h3>

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
}

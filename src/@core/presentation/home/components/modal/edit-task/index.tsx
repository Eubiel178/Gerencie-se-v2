"use client";

import { useState } from "react";

import { FaEdit } from "react-icons/fa";
import { MdClose } from "react-icons/md";
import { useForm } from "react-hook-form";
import { useFormTags } from "@/@core/presentation/hooks";
import { zodResolver } from "@hookform/resolvers/zod";

import { validationSchema } from "@/validation/taskSchema";

import { Form, Modal, Input, Button, Wrapper } from "@/components/_ui";

import { FormData, IModalProps } from "./interfaces";

export function EditTask({ taskBeingEdited }: IModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const formTags = useFormTags();

  const {
    reset,
    register,
    formState: { errors, isSubmitting },
    handleSubmit,
  } = useForm<FormData>({
    mode: "onChange",
    resolver: zodResolver(validationSchema),
    defaultValues: {
      ...taskBeingEdited,
    },
  });

  const closeModal = () => {
    setIsOpen(false);
    reset();
  };

  const handleFormSubmit = (data: FormData) => {
    closeModal();
  };

  return (
    <>
      <Button
        color="primary"
        background="transparent"
        size="xlarge"
        onClick={function () {
          setIsOpen(true);
        }}
      >
        <FaEdit />
      </Button>

      {isOpen && (
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
                    optionsArray={formTags.options}
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
      )}
    </>
  );
}

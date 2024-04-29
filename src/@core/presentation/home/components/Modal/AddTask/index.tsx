"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MdClose } from "react-icons/md";

import { validationSchema } from "@/validation/taskSchema";
import { Form, Input, Modal, Button, Wrapper } from "@/components/_ui";

import { FormData, IModalProps } from "./interfaces";

export function AddTask({ open, setOpen }: IModalProps) {
  const {
    reset,
    register,
    formState: { errors, isSubmitting },
    handleSubmit,
  } = useForm<FormData>({
    mode: "onChange",
    resolver: zodResolver(validationSchema),
    defaultValues: {
      tag: "",
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
    setOpen(false);
    reset();
  };

  const handleFormSubmit = (data: FormData) => {};

  return (
    <>
      {open && (
        <Modal>
          <Wrapper justify="between" align="center">
            <h3>Nova Tarefa</h3>

            <Button
              color="secondary"
              size="xlarge"
              onClick={closeModal}
              background="transparent"
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

            <Button loading={isSubmitting}>Nova Tarefa</Button>
          </Form.Root>
        </Modal>
      )}
    </>
  );
}

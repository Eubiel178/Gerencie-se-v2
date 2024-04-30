"use client";

import { useState } from "react";

import { MdClose } from "react-icons/md";
import { useForm } from "react-hook-form";
import { useFormTags } from "@/@core/presentation/hooks";
import { zodResolver } from "@hookform/resolvers/zod";

import { validationSchema } from "@/validation/taskSchema";

import { Form, Input, Modal, Button, Wrapper } from "@/components/_ui";

import { create } from "../actions";

import { FormData, IAddTaskProps } from "../interfaces";

export function AddTask({ buttonText }: IAddTaskProps) {
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
      tag: "",
      title: "",
      description: "",
    },
  });

  function closeModal() {
    setIsOpen(false);
    reset();
  }

  async function handleOnSubmit(data: FormData) {
    const response = await create(data).then(closeModal);
  }

  return (
    <>
      <Button
        type="button"
        onClick={function () {
          setIsOpen(true);
        }}
      >
        {buttonText}
      </Button>

      {isOpen && (
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

          <Form.Root onSubmit={handleSubmit(handleOnSubmit)}>
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

            <Button loading={isSubmitting}>Nova Tarefa</Button>
          </Form.Root>
        </Modal>
      )}
    </>
  );
}

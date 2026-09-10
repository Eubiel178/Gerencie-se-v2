"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { FaEdit } from "react-icons/fa";
import { MdClose } from "react-icons/md";
import { useForm, useWatch } from "react-hook-form";
import { useFormTags } from "@/features/tasks/hooks/use-form-tags";
import { zodResolver } from "@hookform/resolvers/zod";

import { validationSchema } from "@/validation/task-schema";

import { Form, Modal, Input, Button, Wrapper, Feedback } from "@/components";

import { updateTaskAction } from "@/features/tasks/actions";

import { SyncWithGoogle } from "../sync-with-google";
import { FormData, IEditTaskProps } from "../interfaces";

export function EditTask({ taskBeingEdited, isGoogleConnected }: IEditTaskProps) {
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const formTags = useFormTags();

  const {
    reset,
    register,
    setValue,
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
  } = useForm<FormData>({
    mode: "onChange",
    resolver: zodResolver(validationSchema),
    defaultValues: {
      tag: taskBeingEdited.tag,
      title: taskBeingEdited.title,
      description: taskBeingEdited.description,
      scheduledAt: taskBeingEdited.scheduledAt || "",
      syncEnabled: taskBeingEdited.syncEnabled,
    },
  });

  const syncEnabled = useWatch({ control, name: "syncEnabled" });

  const closeModal = () => {
    setIsOpen(false);
    reset();
  };

  const handleFormSubmit = async (data: FormData) => {
    setSubmitError(null);

    const result = await updateTaskAction({
      ...data,
      id: taskBeingEdited.id,
    });

    if (result.error) {
      setSubmitError(result.error);
      return;
    }

    closeModal();
    router.refresh();
  };

  return (
    <>
      <Button
        color="primary"
        background="transparent"
        size="xlarge"
        aria-label={`Editar tarefa ${taskBeingEdited.title}`}
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
              aria-label="Fechar"
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
                    rows={5}
                    placeholder="Descrição da Tarefa"
                  />
                </Input.Wrapper>

                <Input.HelperText />
              </Input.Root>

              <SyncWithGoogle
                register={register}
                setValue={setValue}
                isChecked={!!syncEnabled}
                isGoogleConnected={isGoogleConnected}
                scheduledAtError={errors.scheduledAt?.message}
              />
            </Form.Wrapper>

            {submitError && <Feedback>{submitError}</Feedback>}

            <Button loading={isSubmitting}>Salvar Alterações</Button>
          </Form.Root>
        </Modal>
      )}
    </>
  );
}

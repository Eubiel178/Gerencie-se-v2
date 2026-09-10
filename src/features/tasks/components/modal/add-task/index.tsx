"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { MdClose } from "react-icons/md";
import { useForm, useWatch } from "react-hook-form";
import { useFormTags } from "@/features/tasks/hooks/use-form-tags";
import { zodResolver } from "@hookform/resolvers/zod";

import { validationSchema } from "@/validation/task-schema";

import { Form, Input, Modal, Button, Wrapper, Feedback } from "@/components";

import { createTaskAction } from "@/features/tasks/actions";

import { SyncWithGoogle } from "../sync-with-google";
import { FormData, IAddTaskProps } from "../interfaces";

export function AddTask({ buttonText, isGoogleConnected }: IAddTaskProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const router = useRouter();

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
      tag: "",
      title: "",
      description: "",
      scheduledAt: "",
      syncEnabled: false,
    },
  });

  const syncEnabled = useWatch({ control, name: "syncEnabled" });

  function closeModal() {
    setIsOpen(false);
    reset();
  }

  async function handleOnSubmit(data: FormData) {
    setSubmitError(null);

    const result = await createTaskAction(data);

    if (result.error) {
      setSubmitError(result.error);
      return;
    }

    closeModal();
    router.refresh();
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

            <Button loading={isSubmitting}>Nova Tarefa</Button>
          </Form.Root>
        </Modal>
      )}
    </>
  );
}

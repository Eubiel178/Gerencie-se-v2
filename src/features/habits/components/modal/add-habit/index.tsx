"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { MdClose } from "react-icons/md";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { validationSchema } from "@/validation/habit-schema";

import { Form, Input, Modal, Button, Wrapper, Feedback } from "@/components";

import { createHabitAction } from "@/features/habits/actions";

import { FormData, IAddHabitProps } from "../interfaces";

const FREQUENCY_OPTIONS = [
  { label: "Todo dia", value: "daily" },
  { label: "Algumas vezes por semana", value: "weekly" },
];

export function AddHabit({ buttonText }: IAddHabitProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const router = useRouter();

  const {
    reset,
    register,
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
  } = useForm<FormData>({
    mode: "onChange",
    resolver: zodResolver(validationSchema),
    defaultValues: {
      title: "",
      frequency: "daily",
      targetPerWeek: "3",
    },
  });

  const frequency = useWatch({ control, name: "frequency" });

  function closeModal() {
    setIsOpen(false);
    reset();
  }

  async function handleOnSubmit(data: FormData) {
    setSubmitError(null);

    const result = await createHabitAction({
      title: data.title,
      frequency: data.frequency,
      targetPerWeek: data.frequency === "weekly" ? Number(data.targetPerWeek) : null,
      goalId: null,
    });

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
            <h3>Novo Hábito</h3>

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
              <Input.Root sharedProps={{ error: errors.title?.message }}>
                <Input.Wrapper>
                  <Input.Field
                    {...register("title")}
                    placeholder="Ex.: Beber água, Ler, Meditar..."
                    autoFocus
                  />
                </Input.Wrapper>

                <Input.HelperText />
              </Input.Root>

              <Input.Root sharedProps={{ error: errors.frequency?.message }}>
                <Input.Label>Frequência</Input.Label>

                <Input.Wrapper>
                  <Input.FieldSelect
                    {...register("frequency")}
                    optionsArray={FREQUENCY_OPTIONS}
                  />
                </Input.Wrapper>

                <Input.HelperText />
              </Input.Root>

              {frequency === "weekly" && (
                <Input.Root sharedProps={{ error: errors.targetPerWeek?.message }}>
                  <Input.Label>Quantas vezes por semana</Input.Label>

                  <Input.Wrapper>
                    <Input.Field
                      {...register("targetPerWeek")}
                      type="number"
                      min={1}
                      max={7}
                    />
                  </Input.Wrapper>

                  <Input.HelperText />
                </Input.Root>
              )}
            </Form.Wrapper>

            {submitError && <Feedback>{submitError}</Feedback>}

            <Button loading={isSubmitting}>Adicionar Hábito</Button>
          </Form.Root>
        </Modal>
      )}
    </>
  );
}

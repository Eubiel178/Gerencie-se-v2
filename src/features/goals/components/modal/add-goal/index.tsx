"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import dayjs from "dayjs";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { validationSchema } from "@/validation/goal-schema";

import { Form, Input, Modal, ModalHeader, Button, ChipGroup, SuggestionChips, CollapsibleSection } from "@/components";
import { Icon } from "@/components/icon";

import { createGoalAction } from "@/features/goals/actions";
import { ShareSelect } from "@/features/connections/components/share-select";

import { FormData, IAddGoalProps, PRIORITY_OPTIONS } from "../interfaces";

import styles from "./add-goal.module.css";

const DEADLINE_SHORTCUTS = [
  { label: "+1 semana", value: () => dayjs().add(1, "week").format("YYYY-MM-DD") },
  { label: "+1 mês", value: () => dayjs().add(1, "month").format("YYYY-MM-DD") },
  { label: "+3 meses", value: () => dayjs().add(3, "month").format("YYYY-MM-DD") },
];

export function AddGoal({ buttonText, connections }: IAddGoalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const router = useRouter();

  const {
    reset,
    register,
    setValue,
    watch,
    formState: { errors, isSubmitting },
    handleSubmit,
  } = useForm<FormData>({
    mode: "onChange",
    resolver: zodResolver(validationSchema),
    defaultValues: {
      title: "",
      description: "",
      deadline: "",
      priority: "media",
      sharedWithUserId: "",
    },
  });

  const priority = watch("priority");

  function closeModal() {
    setIsOpen(false);
    reset();
  }

  async function handleOnSubmit(data: FormData) {
    setSubmitError(null);

    const result = await createGoalAction({
      title: data.title,
      description: data.description,
      deadline: data.deadline || null,
      priority: data.priority,
      sharedWithUserId: data.sharedWithUserId,
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
      <Button.Root
        type="button"
        onClick={function () {
          setIsOpen(true);
        }}
      >
        {buttonText}
      </Button.Root>

      {isOpen && (
        <Modal onClose={closeModal}>
          <ModalHeader title="Novo Objetivo" onClose={closeModal} />

          <Form.Root onSubmit={handleSubmit(handleOnSubmit)}>
            <Form.Wrapper>
              <Input.Root sharedProps={{ error: errors.title?.message }}>
                <Input.Wrapper>
                  <Input.Field
                    className={styles.titleField}
                    {...register("title")}
                    placeholder="Qual objetivo você quer alcançar?"
                    autoFocus
                  />
                </Input.Wrapper>

                <Input.HelperText />
              </Input.Root>

              <Input.Root sharedProps={{ error: errors.description?.message }}>
                <Input.Label>
                  <Icon name="FaAlignLeft" size={12} /> Descrição
                </Input.Label>
                <Input.Wrapper>
                  <Input.FieldTextarea
                    {...register("description")}
                    rows={3}
                    placeholder="Detalhes (opcional)"
                  />
                </Input.Wrapper>

                <Input.HelperText />
              </Input.Root>

              <Input.Root sharedProps={{ error: errors.deadline?.message }}>
                <Input.Label>
                  <Icon name="FaCalendarAlt" size={12} /> Prazo (opcional)
                </Input.Label>

                <Input.Wrapper>
                  <Input.Field {...register("deadline")} type="date" />
                </Input.Wrapper>

                <SuggestionChips
                  label="Atalhos de prazo"
                  suggestions={DEADLINE_SHORTCUTS.map((shortcut) => shortcut.label)}
                  onSelect={(label) => {
                    const shortcut = DEADLINE_SHORTCUTS.find((option) => option.label === label);
                    if (shortcut) setValue("deadline", shortcut.value(), { shouldValidate: true });
                  }}
                />

                <Input.HelperText />
              </Input.Root>

              <Input.Root sharedProps={{ error: errors.priority?.message }}>
                <Input.Label>
                  <Icon name="FaFlag" size={12} /> Prioridade
                </Input.Label>

                <ChipGroup
                  aria-label="Prioridade"
                  options={PRIORITY_OPTIONS}
                  value={priority}
                  onChange={(value) => setValue("priority", value as FormData["priority"], { shouldValidate: true })}
                />

                <Input.HelperText />
              </Input.Root>

              <CollapsibleSection label="Mais opções">
                <Input.Root sharedProps={{ error: errors.sharedWithUserId?.message }}>
                  <Input.Label>Compartilhar com</Input.Label>

                  <Input.Wrapper>
                    <ShareSelect connections={connections} {...register("sharedWithUserId")} />
                  </Input.Wrapper>

                  <Input.HelperText />
                </Input.Root>
              </CollapsibleSection>
            </Form.Wrapper>

            {submitError && <p className={styles.formError}>{submitError}</p>}

            <Button.Root loading={isSubmitting}>Criar Objetivo</Button.Root>
          </Form.Root>
        </Modal>
      )}
    </>
  );
}

"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { FaEdit } from "react-icons/fa";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { validationSchema } from "@/validation/goal-schema";

import { Form, Modal, ModalHeader, Input, Button, IconButton } from "@/components";

import { updateGoalAction } from "@/features/goals/actions";
import { ShareSelect } from "@/features/connections/components/share-select";
import { ShareReadOnlyNote } from "@/features/connections/components/share-readonly-note";

import { FormData, IEditGoalProps, PRIORITY_OPTIONS } from "../interfaces";

import styles from "./edit-goal.module.css";

export function EditGoal({ goalBeingEdited, connections }: IEditGoalProps) {
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    reset,
    register,
    formState: { errors, isSubmitting },
    handleSubmit,
  } = useForm<FormData>({
    mode: "onChange",
    resolver: zodResolver(validationSchema),
    defaultValues: {
      title: goalBeingEdited.title,
      description: goalBeingEdited.description,
      deadline: goalBeingEdited.deadline || "",
      priority: goalBeingEdited.priority,
      sharedWithUserId: goalBeingEdited.sharedWithUserId ?? "",
    },
  });

  const closeModal = () => {
    setIsOpen(false);
    reset();
  };

  const handleFormSubmit = async (data: FormData) => {
    setSubmitError(null);

    const result = await updateGoalAction({
      id: goalBeingEdited.id,
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
  };

  return (
    <>
      <IconButton
        tone="highlight"
        aria-label={`Editar objetivo ${goalBeingEdited.title}`}
        onClick={function () {
          setIsOpen(true);
        }}
      >
        <FaEdit />
      </IconButton>

      {isOpen && (
        <Modal>
          <ModalHeader title="Editar Objetivo" onClose={closeModal} />

          <Form.Root onSubmit={handleSubmit(handleFormSubmit)}>
            <Form.Wrapper>
              <Input.Root sharedProps={{ error: errors.title?.message }}>
                <Input.Wrapper>
                  <Input.Field {...register("title")} placeholder="Ex.: Estudar inglês" />
                </Input.Wrapper>

                <Input.HelperText />
              </Input.Root>

              <Input.Root sharedProps={{ error: errors.description?.message }}>
                <Input.Wrapper>
                  <Input.FieldTextarea
                    {...register("description")}
                    rows={3}
                    placeholder="Descrição (opcional)"
                  />
                </Input.Wrapper>

                <Input.HelperText />
              </Input.Root>

              <Input.Root sharedProps={{ error: errors.deadline?.message }}>
                <Input.Label>Prazo (opcional)</Input.Label>

                <Input.Wrapper>
                  <Input.Field {...register("deadline")} type="date" />
                </Input.Wrapper>

                <Input.HelperText />
              </Input.Root>

              <Input.Root sharedProps={{ error: errors.priority?.message }}>
                <Input.Label>Prioridade</Input.Label>

                <Input.Wrapper>
                  <Input.FieldSelect
                    {...register("priority")}
                    optionsArray={PRIORITY_OPTIONS}
                  />
                </Input.Wrapper>

                <Input.HelperText />
              </Input.Root>

              <Input.Root sharedProps={{ error: errors.sharedWithUserId?.message }}>
                <Input.Label>Compartilhar com</Input.Label>

                <Input.Wrapper>
                  <ShareSelect
                    connections={connections}
                    disabled={goalBeingEdited.isSharedWithMe}
                    {...register("sharedWithUserId")}
                  />
                </Input.Wrapper>

                <Input.HelperText />
              </Input.Root>

              {goalBeingEdited.isSharedWithMe && (
                <ShareReadOnlyNote noun="este objetivo" className={styles.readOnlyNote} />
              )}
            </Form.Wrapper>

            {submitError && <p className={styles.formError}>{submitError}</p>}

            <Button loading={isSubmitting}>Salvar Alterações</Button>
          </Form.Root>
        </Modal>
      )}
    </>
  );
}

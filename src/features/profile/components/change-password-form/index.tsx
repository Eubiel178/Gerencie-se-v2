"use client";

import { useState } from "react";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Form, Input, Button } from "@/components";
import { useToast } from "@/providers/toast-context";

import { changePasswordAction } from "@/features/profile/actions";
import { changePasswordSchema } from "@/validation/change-password-schema";

import styles from "./change-password-form.module.css";

type FormData = z.infer<typeof changePasswordSchema>;

const EMPTY_VALUES: FormData = { currentPassword: "", newPassword: "", confirmNewPassword: "" };

/** Só é renderizado quando a conta tem senha própria (ver `Settings`,
 * seção "Conta") — login só-Google nem chega a ver este formulário. */
export function ChangePasswordForm() {
  const { showToast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    handleSubmit,
    register,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    mode: "onChange",
    resolver: zodResolver(changePasswordSchema),
    defaultValues: EMPTY_VALUES,
  });

  function closeForm() {
    setIsOpen(false);
    setSubmitError(null);
    reset(EMPTY_VALUES);
  }

  async function handleFormSubmit(data: FormData) {
    setSubmitError(null);

    const result = await changePasswordAction(data);

    if (result.error) {
      setSubmitError(result.error);
      return;
    }

    showToast("Senha alterada!");
    closeForm();
  }

  if (!isOpen) {
    return (
      <Button.Root variant="secondary" type="button" onClick={() => setIsOpen(true)}>
        Trocar senha
      </Button.Root>
    );
  }

  return (
    <Form.Root onSubmit={handleSubmit(handleFormSubmit)}>
      <Form.Wrapper>
        <Input.Root sharedProps={{ error: errors.currentPassword?.message }}>
          <Input.Label htmlFor="currentPassword">Senha atual</Input.Label>
          <Input.Wrapper>
            <Input.FieldPassword {...register("currentPassword")} autoFocus />
          </Input.Wrapper>
          <Input.HelperText />
        </Input.Root>

        <Input.Root sharedProps={{ error: errors.newPassword?.message }}>
          <Input.Label htmlFor="newPassword">Nova senha</Input.Label>
          <Input.Wrapper>
            <Input.FieldPassword {...register("newPassword")} />
          </Input.Wrapper>
          <Input.HelperText />
        </Input.Root>

        <Input.Root sharedProps={{ error: errors.confirmNewPassword?.message }}>
          <Input.Label htmlFor="confirmNewPassword">Confirmar nova senha</Input.Label>
          <Input.Wrapper>
            <Input.FieldPassword {...register("confirmNewPassword")} />
          </Input.Wrapper>
          <Input.HelperText />
        </Input.Root>
      </Form.Wrapper>

      {submitError && <p className={styles.formError}>{submitError}</p>}

      <div className={styles.actions}>
        <Button.Root variant="secondary" type="button" onClick={closeForm}>
          Cancelar
        </Button.Root>
        <Button.Root loading={isSubmitting}>Salvar nova senha</Button.Root>
      </div>
    </Form.Root>
  );
}

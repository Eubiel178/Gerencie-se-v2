"use client";

import { useState } from "react";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Alert, Form, Input, Button } from "@/components";

import { requestPasswordResetAction } from "@/features/auth/actions";
import { GENERIC_RESET_REQUEST_MESSAGE } from "@/features/auth/reset-request-message";
import { validationSchema } from "@/validation/forgot-password-schema";

import styles from "../../../auth-page.module.css";

type FormData = z.infer<typeof validationSchema>;

export function Auth() {
  const [formError, setFormError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const {
    handleSubmit,
    formState: { errors, isSubmitting },
    register,
  } = useForm<FormData>({
    resolver: zodResolver(validationSchema),
    mode: "onChange",
    defaultValues: { email: "" },
  });

  const handleOnSubmit = async (data: FormData) => {
    setFormError(null);

    const result = await requestPasswordResetAction(data);

    if (result.error) {
      setFormError(result.error);
      return;
    }

    setSent(true);
  };

  if (sent) {
    return (
      <section className={styles.formCard}>
        <h1>Verifique seu e-mail</h1>

        <p>{GENERIC_RESET_REQUEST_MESSAGE}</p>

        <div className={styles.authSwitch}>
          <Link className={styles.link} href="/login">
            Voltar para o login
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.formCard}>
      <h1>Esqueceu sua senha?</h1>

      <p>Informe seu e-mail de cadastro e enviaremos um link para redefinir sua senha.</p>

      <Form.Root onSubmit={handleSubmit(handleOnSubmit)}>
        <Form.Wrapper>
          <Input.Root sharedProps={{ error: errors.email?.message }}>
            <Input.Label htmlFor="email">E-mail</Input.Label>
            <Input.Wrapper>
              <Input.Field
                {...register("email")}
                id="email"
                placeholder="Seu email aqui"
                autoFocus
              />
            </Input.Wrapper>

            <Input.HelperText />
          </Input.Root>
        </Form.Wrapper>

        {formError && <Alert variant="error">{formError}</Alert>}

        <Button.Root loading={isSubmitting}>Enviar link</Button.Root>
      </Form.Root>

      <div className={styles.authSwitch}>
        <Link className={styles.link} href="/login">
          Voltar para o login
        </Link>
      </div>
    </section>
  );
}

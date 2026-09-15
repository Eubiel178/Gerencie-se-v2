"use client";

import { useState } from "react";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Alert, Form, Input, Button } from "@/components";
import { useToast } from "@/providers/toast-context";

import { resetPasswordAction } from "@/features/auth/actions";
import { validationSchema } from "@/validation/reset-password-schema";

import styles from "../../../auth-page.module.css";

type FormData = z.infer<typeof validationSchema>;

export function Auth() {
  const router = useRouter();
  const { showToast } = useToast();
  const token = useSearchParams().get("token");

  const [formError, setFormError] = useState<string | null>(null);

  const {
    handleSubmit,
    formState: { errors, isSubmitting },
    register,
  } = useForm<FormData>({
    resolver: zodResolver(validationSchema),
    mode: "onChange",
    defaultValues: { password: "", confirm_password: "" },
  });

  const handleOnSubmit = async (data: FormData) => {
    setFormError(null);

    if (!token) {
      setFormError("Link inválido ou expirado. Peça uma nova redefinição.");
      return;
    }

    const result = await resetPasswordAction(token, data);

    if (result.error) {
      setFormError(result.error);
      return;
    }

    showToast("Senha redefinida! Faça login com a nova senha.");
    router.push("/login");
  };

  return (
    <section className={styles.formCard}>
      <h1>Redefinir senha</h1>

      {!token && (
        <Alert variant="error">
          Link inválido ou expirado. Peça uma nova redefinição na{" "}
          <Link className={styles.link} href="/forgot-password">
            tela de recuperação
          </Link>
          .
        </Alert>
      )}

      <Form.Root onSubmit={handleSubmit(handleOnSubmit)}>
        <Form.Wrapper>
          <Input.Root sharedProps={{ error: errors.password?.message }}>
            <Input.Label htmlFor="password">Nova senha</Input.Label>
            <Input.Wrapper>
              <Input.FieldPassword
                {...register("password")}
                id="password"
                autoFocus
              />
            </Input.Wrapper>
            <Input.HelperText />
          </Input.Root>

          <Input.Root sharedProps={{ error: errors.confirm_password?.message }}>
            <Input.Label htmlFor="confirm_password">Confirmar nova senha</Input.Label>
            <Input.Wrapper>
              <Input.FieldPassword
                {...register("confirm_password")}
                id="confirm_password"
              />
            </Input.Wrapper>
            <Input.HelperText />
          </Input.Root>
        </Form.Wrapper>

        {formError && <Alert variant="error">{formError}</Alert>}

        <Button.Root loading={isSubmitting} disabled={!token}>
          Redefinir senha
        </Button.Root>
      </Form.Root>

      <div className={styles.authSwitch}>
        <Link className={styles.link} href="/login">
          Voltar para o login
        </Link>
      </div>
    </section>
  );
}

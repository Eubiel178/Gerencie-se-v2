"use client";

import { useState } from "react";

import { signOut } from "next-auth/react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Alert, Form, Input, Button } from "@/components";
import { useToast } from "@/providers/toast-context";

import { resendVerificationCodeAction, verifyEmailAction } from "@/features/auth/actions";
import { validationSchema } from "@/validation/verify-email-schema";

import styles from "../../../auth-page.module.css";

type FormData = z.infer<typeof validationSchema>;

// Tempo mínimo entre um reenvio e o próximo, só pra não deixar clique
// repetido disparar vários e-mails seguidos por engano — não é uma
// defesa contra abuso de verdade (isso exigiria um limite do lado do
// servidor), só uma trava de UX.
const RESEND_COOLDOWN_SECONDS = 30;

interface AuthProps {
  email: string | null;
  deliveryFailed: boolean;
}

export function Auth({ email, deliveryFailed }: AuthProps) {
  const { showToast } = useToast();

  const [formError, setFormError] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [showDeliveryFailed, setShowDeliveryFailed] = useState(deliveryFailed);

  const {
    handleSubmit,
    formState: { errors, isSubmitting },
    register,
  } = useForm<FormData>({
    resolver: zodResolver(validationSchema),
    mode: "onChange",
    defaultValues: { code: "" },
  });

  const handleOnSubmit = async (data: FormData) => {
    setFormError(null);

    const result = await verifyEmailAction(data);

    if (result.error) {
      setFormError(result.error);
    }
    // Sucesso redireciona pra /home direto na Server Action (ver
    // `verifyEmailAction`) — não há nada mais a fazer aqui nesse caso.
  };

  async function handleResend() {
    if (isResending || cooldown > 0) return;

    setIsResending(true);
    setFormError(null);

    const result = await resendVerificationCodeAction();

    setIsResending(false);

    if (result.error) {
      setFormError(result.error);
      return;
    }

    showToast("Código reenviado.");
    setShowDeliveryFailed(false);
    setCooldown(RESEND_COOLDOWN_SECONDS);

    const interval = setInterval(() => {
      setCooldown((current) => {
        if (current <= 1) {
          clearInterval(interval);
          return 0;
        }
        return current - 1;
      });
    }, 1000);
  }

  function handleSignOut() {
    signOut({ callbackUrl: "/register" });
  }

  return (
    <section className={styles.formCard}>
      <div>
        <h1>Confirme seu e-mail</h1>
        <p className={styles.formIntro}>Falta só uma etapa para abrir seu painel.</p>
      </div>

      <p className={styles.formIntro}>
        {email
          ? `Enviamos um código de 6 dígitos para ${email}. Digite abaixo para concluir seu cadastro.`
          : "Enviamos um código de 6 dígitos para o e-mail do seu cadastro. Digite abaixo para continuar."}
      </p>

      {showDeliveryFailed && (
        <Alert variant="warning">
          Não conseguimos enviar o primeiro código. Use “Reenviar código” para tentar novamente.
        </Alert>
      )}

      <Form.Root onSubmit={handleSubmit(handleOnSubmit)}>
        <Form.Wrapper>
          <Input.Root sharedProps={{ error: errors.code?.message }}>
            <Input.Label htmlFor="code">Código</Input.Label>
            <Input.Wrapper>
              <Input.Field
                {...register("code")}
                id="code"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="000000"
                autoFocus
              />
            </Input.Wrapper>
            <Input.HelperText />
          </Input.Root>
        </Form.Wrapper>

        {formError && <Alert variant="error">{formError}</Alert>}

        <Button.Root loading={isSubmitting}>Confirmar</Button.Root>
      </Form.Root>

      <div className={styles.authSwitch}>
        <Button.Root
          type="button"
          variant="secondary"
          loading={isResending}
          disabled={cooldown > 0}
          onClick={handleResend}
        >
          {cooldown > 0 ? `Reenviar código (${cooldown}s)` : "Reenviar código"}
        </Button.Root>
      </div>

      <div className={styles.authSwitch}>
        <p className={styles.authSwitchText}>Errou o e-mail no cadastro?</p>
        <button type="button" className={styles.link} onClick={handleSignOut}>
          Sair e cadastrar de novo
        </button>
      </div>
    </section>
  );
}

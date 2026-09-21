"use client";

import { useEffect, useRef, useState } from "react";

import { useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";
import { signOut } from "next-auth/react";
import { z } from "zod";

import { Alert, Form, Input, Button } from "@/components";
import { resendVerificationCodeAction, verifyEmailAction } from "@/features/auth/actions";
import { useToast } from "@/providers/toast-context";
import { validationSchema } from "@/validation/verify-email-schema";

import styles from "../../../auth-page.module.css";

type FormData = z.infer<typeof validationSchema>;

// A interface espelha o mesmo limite que o servidor aplica. O servidor é
// a proteção real; isto apenas evita um clique que sabemos que falharia.
const RESEND_COOLDOWN_SECONDS = 30;

interface AuthProps {
  email: string | null;
  deliveryFailed: boolean;
  resumed: boolean;
}

export function Auth({ email, deliveryFailed, resumed }: AuthProps) {
  const { showToast } = useToast();

  const [formError, setFormError] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [showDeliveryFailed, setShowDeliveryFailed] = useState(deliveryFailed);
  // Só afirmamos que há um código no e-mail quando o servidor confirmou
  // que o SMTP aceitou o envio. Isso evita a contradição "enviamos" +
  // "não conseguimos enviar" quando o primeiro envio falha no cadastro.
  const [hasDeliveredCode, setHasDeliveredCode] = useState(!deliveryFailed);
  // Guarda o intervalo pra poder cancelar se o componente desmontar no
  // meio da contagem (ex.: usuário navega pra fora) — antes o intervalo
  // só se auto-limpava chegando a 0, então sair da página no meio deixava
  // ele rodando indefinidamente contra um closure obsoleto.
  const cooldownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (cooldownIntervalRef.current) clearInterval(cooldownIntervalRef.current);
    };
  }, []);

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
      if (result.retryAfterSeconds) {
        startResendCooldown(result.retryAfterSeconds);
      }
      return;
    }

    showToast("Código reenviado.");
    setShowDeliveryFailed(false);
    setHasDeliveredCode(true);
    startResendCooldown(RESEND_COOLDOWN_SECONDS);
  }

  function startResendCooldown(seconds: number) {
    setCooldown(seconds);
    if (cooldownIntervalRef.current) clearInterval(cooldownIntervalRef.current);
    cooldownIntervalRef.current = setInterval(() => {
      setCooldown((current) => {
        if (current <= 1) {
          if (cooldownIntervalRef.current) clearInterval(cooldownIntervalRef.current);
          cooldownIntervalRef.current = null;
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
        {hasDeliveredCode
          ? email
            ? `Enviamos um código de 6 dígitos para ${email}. Se não encontrá-lo em alguns minutos, verifique a caixa de spam.`
            : "Enviamos um código de 6 dígitos para o e-mail do seu cadastro. Se não encontrá-lo em alguns minutos, verifique a caixa de spam."
          : "Ainda não há um código disponível. Tente reenviar para receber um novo código."}
      </p>

      {showDeliveryFailed && (
        <Alert variant="warning">
          Não conseguimos enviar o primeiro código. Use “Reenviar código” para tentar novamente.
        </Alert>
      )}

      {resumed && !showDeliveryFailed && (
        <Alert variant="info">
          Seu cadastro ainda está pendente. Confirme o código para ativar sua conta.
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
        <p className={styles.authSwitchText}>Informou o e-mail errado?</p>
        <button type="button" className={styles.link} onClick={handleSignOut}>
          Voltar e usar outro e-mail
        </button>
      </div>
    </section>
  );
}

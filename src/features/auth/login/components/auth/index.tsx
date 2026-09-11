"use client";

import { useState } from "react";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { validationSchema } from "@/validation/login-schema";

import styles from "../../../auth-page.module.css";

import { FaGoogle } from "react-icons/fa";

import { Form, Input, Button } from "@/components";

import { loginAction } from "@/features/auth/actions";
import { authErrorMessage } from "@/lib/auth-error-messages";

type FormData = z.infer<typeof validationSchema>;

export function Auth() {
  const searchParams = useSearchParams();

  // O Auth.js redireciona de volta pra cá com `?error=...` quando o login
  // com Google falha (ex.: usuário cancelou, ou o e-mail já tem conta
  // criada de outra forma). Nunca deixamos essa tela sem explicação nesses
  // casos, e nunca criamos uma sessão inválida. Calculado como estado
  // inicial (não via efeito): esse redirecionamento é sempre um carregamento
  // de página novo, então o valor de `searchParams` no primeiro render já é
  // o definitivo — não há necessidade de sincronizar depois.
  const [formError, setFormError] = useState<string | null>(() =>
    authErrorMessage(searchParams.get("error"))
  );
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const {
    handleSubmit,
    formState: { errors, isSubmitting },
    register,
  } = useForm<FormData>({
    resolver: zodResolver(validationSchema),
    mode: "onChange",
    defaultValues: {
      email: "",
      password: "",
      remember_me: false,
    },
  });

  const handleOnSubmit = async (data: FormData) => {
    setFormError(null);

    const result = await loginAction(data);

    if (result.error) {
      setFormError(result.error);
    }
  };

  function handleGoogleSignIn() {
    setIsGoogleLoading(true);
    signIn("google", { callbackUrl: "/home" });
  }

  return (
    <section className={styles.formCard}>
      <h1>Login</h1>

      <Form.Root onSubmit={handleSubmit(handleOnSubmit)}>
        <Form.Wrapper>
          <Input.Root sharedProps={{ error: errors.email?.message }}>
            <Input.Wrapper>
              <Input.Field
                {...register("email")}
                placeholder="Seu email aqui"
                autoFocus
              />
            </Input.Wrapper>

            <Input.HelperText />
          </Input.Root>

          <Input.Root sharedProps={{ error: errors.password?.message }}>
            <Input.Wrapper>
              <Input.FieldPassword
                {...register("password")}
                placeholder="Sua senha aqui"
              />
            </Input.Wrapper>

            <Input.HelperText />
          </Input.Root>

          <Input.Root direction="row" justify="between" align="center">
            <Link className={styles.link} href="#">Esqueceu sua senha?</Link>

            <Input.Wrapper gap="small">
              <Input.Wrapper>
                <Input.Field
                  {...register("remember_me")}
                  type="checkbox"
                  id="remember_me"
                />
              </Input.Wrapper>

              <Input.Label htmlFor="remember_me">
                Manter-me conectado
              </Input.Label>
            </Input.Wrapper>
          </Input.Root>
        </Form.Wrapper>

        {formError && <p className={styles.formError}>{formError}</p>}

        <Button loading={isSubmitting}>Entrar</Button>
      </Form.Root>

      <Button
        type="button"
        variant="secondary"
        loading={isGoogleLoading}
        onClick={handleGoogleSignIn}
      >
        <span className={styles.googleButtonContent}>
          <FaGoogle aria-hidden="true" />
          <span>Continuar com Google</span>
        </span>
      </Button>

      <div className={styles.authSwitch}>
        <p className={styles.authSwitchText}>Ainda não tem conta?</p>

        <Link className={styles.link} href="/register">Cadastre-se</Link>
      </div>
    </section>
  );
}

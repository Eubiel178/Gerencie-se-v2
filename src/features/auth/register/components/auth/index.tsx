"use client";

import { useState } from "react";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { validationSchema } from "@/validation/register-schema";

import styles from "../../../auth-page.module.css";

import { FaGoogle } from "react-icons/fa";

import {
  Form,
  Input,
  Button,
  Wrapper,
  Paragraph,
  Feedback,
} from "@/components";

import { registerAction } from "@/features/auth/actions";

type FormData = z.input<typeof validationSchema>;

export function Auth() {
  const [formError, setFormError] = useState<string | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const {
    handleSubmit,
    formState: { errors, isSubmitting },
    register,
  } = useForm<FormData>({
    resolver: zodResolver(validationSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirm_password: "",
    },
  });

  const handleOnSubmit = async (data: FormData) => {
    setFormError(null);

    const result = await registerAction(data);

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
      <h1>Cadastre-se</h1>

      <Form.Root onSubmit={handleSubmit(handleOnSubmit)}>
        <Form.Wrapper>
          <Input.Root
            sharedProps={{
              error: errors.name?.message,
            }}
          >
            <Input.Wrapper>
              <Input.Field
                {...register("name")}
                placeholder="Seu nome aqui"
                autoFocus
              />
            </Input.Wrapper>

            <Input.HelperText />
          </Input.Root>

          <Input.Root sharedProps={{ error: errors.email?.message }}>
            <Input.Wrapper>
              <Input.Field
                {...register("email")}
                type="email"
                placeholder="Seu email aqui"
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

          <Input.Root sharedProps={{ error: errors.confirm_password?.message }}>
            <Input.Wrapper>
              <Input.FieldPassword
                {...register("confirm_password")}
                placeholder="Confirme sua senha aqui"
              />
            </Input.Wrapper>

            <Input.HelperText />
          </Input.Root>
        </Form.Wrapper>

        {formError && <Feedback>{formError}</Feedback>}

        <Button loading={isSubmitting}>Cadastrar</Button>
      </Form.Root>

      <Button
        type="button"
        background="secondary"
        loading={isGoogleLoading}
        onClick={handleGoogleSignIn}
      >
        <Wrapper align="center" gap="small" background="transparent">
          <FaGoogle aria-hidden="true" />
          <span>Continuar com Google</span>
        </Wrapper>
      </Button>

      <Wrapper align="center" gap="small">
        <Paragraph>Já tem uma conta?</Paragraph>

        <Link className={styles.link} href="/login">Logar</Link>
      </Wrapper>
    </section>
  );
}

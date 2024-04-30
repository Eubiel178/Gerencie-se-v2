"use client";

import { tv } from "tailwind-variants";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { validationSchema } from "@/validation/loginSchema";

import {
  Button,
  DefaultLink,
  Form,
  Input,
  Paragraph,
  TitleOne,
  Wrapper,
} from "@/components/_ui";

const styles = tv({
  base: "p-8 flex flex-col gap-16",
});

type FormData = z.infer<typeof validationSchema>;

export const Auth = () => {
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

  const handleOnSubmit = (data: FormData) => {
    console.log(data);
  };

  return (
    <section className={styles()}>
      <TitleOne>Login</TitleOne>

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
            <DefaultLink href="#">Esqueceu sua senha?</DefaultLink>

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

        <Button loading={isSubmitting}>Entrar</Button>
      </Form.Root>

      <Wrapper align="center" gap="small">
        <Paragraph>Ainda não tem conta?</Paragraph>

        <DefaultLink href="/register">Cadastre-se</DefaultLink>
      </Wrapper>
    </section>
  );
};

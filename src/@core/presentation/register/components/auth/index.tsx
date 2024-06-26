"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { validationSchema } from "@/validation/registerSchema";

import { tv } from "tailwind-variants";

import {
  Form,
  Input,
  Button,
  Wrapper,
  Paragraph,
  DefaultLink,
} from "@/components";

const styles = tv({
  base: "p-8 flex flex-col gap-16",
});

type FormData = z.input<typeof validationSchema>;

export function Auth() {
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
    console.log(data);
  };

  return (
    <section className={styles()}>
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

        <Button loading={isSubmitting}>Cadastrar</Button>
      </Form.Root>

      <Wrapper align="center" gap="small">
        <Paragraph>Já tem uma conta?</Paragraph>

        <DefaultLink href="/login">Logar</DefaultLink>
      </Wrapper>
    </section>
  );
}

"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { validationSchema } from "@/validation/loginSchema";

import Image from "next/image";
import img from "@/assets/img/login/login.svg";

import { Title, FormContainer, Input, DefaultLink } from "@/components";

type FormData = z.infer<typeof validationSchema>;

const Login = () => {
  const {
    handleSubmit,
    formState: { errors, isSubmitting },
    register,
  } = useForm<FormData>({
    resolver: zodResolver(validationSchema),
    mode: "all",
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
    <>
      <figure className="bg-sky-600 flex-1 flex items-center justify-center tablet:hidden">
        <Image className="w-10/12" src={img} alt="Figura de usuário entrando" />
      </figure>

      <main className="bg-white flex-1 flex items-center justify-center">
        <section className="p-8 flex flex-col gap-16">
          <Title.One>Login</Title.One>

          <FormContainer
            onSubmit={handleSubmit(handleOnSubmit)}
            isSubmitting={isSubmitting}
            buttonLabel="Logar"
          >
            <Input.Root>
              <Input.Div>
                <Input.Field
                  {...register("email")}
                  placeholder="Seu email aqui"
                  autoFocus
                />
              </Input.Div>

              <Input.HelperText
                error={errors?.email && errors?.email.message}
              />
            </Input.Root>

            <Input.Root>
              <Input.Div>
                <Input.FieldPassword
                  {...register("password")}
                  placeholder="Sua senha aqui"
                />
              </Input.Div>

              <Input.HelperText
                error={errors?.password && errors?.password.message}
              />
            </Input.Root>

            <div className="flex justify-between items-center text-sm">
              <DefaultLink href="#">Esqueceu sua senha?</DefaultLink>

              <div className="flex items-center gap-1">
                <input
                  {...register("remember_me")}
                  type="checkbox"
                  id="remember_me"
                />

                <label htmlFor="remember_me">Manter-me conectado</label>
              </div>
            </div>
          </FormContainer>

          <div className="flex gap-2 ">
            <p>Ainda não tem conta?</p>

            <DefaultLink href="/register">Cadastre-se</DefaultLink>
          </div>
        </section>
      </main>
    </>
  );
};

export default Login;

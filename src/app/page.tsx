"use client";

import { tv } from "tailwind-variants";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { validationSchema } from "@/validation/loginSchema";

import Image from "next/image";
import img from "@/assets/img/login/login.svg";

import { TitleOne, FormContainer, Input, DefaultLink } from "@/components";

const loginTv = tv(
  {
    slots: {
      figure: "bg-sky-600",
      image: "w-10/12",
      main: "flex-1 flex items-center justify-center bg-white",
      section: "p-8 flex flex-col gap-16",
      recoverPasswordDiv: "gap-2",
      rememberMeDiv: "gap-1",
      registerPageDiv: "flex items-center gap-2",
    },

    variants: {
      responsive: {
        mobile: {
          figure: "hidden",
        },
        medium: {
          figure: "flex-1 flex items-center justify-center",
        },
      },
    },

    compoundSlots: [
      {
        slots: ["recoverPasswordDiv", "rememberMeDiv"],
        className: "flex items-center justify-between text-sm",
      },
    ],
  },

  { responsiveVariants: ["md"] }
);

type FormData = z.infer<typeof validationSchema>;

const Login = () => {
  const {
    handleSubmit,
    formState: { errors, isSubmitting },
    register,
  } = useForm<FormData>({
    resolver: zodResolver(validationSchema),
    mode: "onBlur",
    defaultValues: {
      email: "",
      password: "",
      remember_me: false,
    },
  });

  const {
    figure,
    image,
    main,
    section,
    recoverPasswordDiv,
    rememberMeDiv,
    registerPageDiv,
  } = loginTv({
    responsive: {
      initial: "mobile",
      md: "medium",
    },
  });

  const handleOnSubmit = (data: FormData) => {
    console.log(data);
  };

  return (
    <>
      <figure className={figure()}>
        <Image className={image()} src={img} alt="Figura de usuário entrando" />
      </figure>

      <main className={main()}>
        <section className={section()}>
          <TitleOne>Login</TitleOne>

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

            <div className={recoverPasswordDiv()}>
              <DefaultLink href="#">Esqueceu sua senha?</DefaultLink>

              <div className={rememberMeDiv()}>
                <input
                  {...register("remember_me")}
                  type="checkbox"
                  id="remember_me"
                />

                <label htmlFor="remember_me">Manter-me conectado</label>
              </div>
            </div>
          </FormContainer>

          <div className={registerPageDiv()}>
            <p>Ainda não tem conta?</p>

            <DefaultLink href="/register">Cadastre-se</DefaultLink>
          </div>
        </section>
      </main>
    </>
  );
};

export default Login;

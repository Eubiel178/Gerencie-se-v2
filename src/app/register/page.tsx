"use client";

import { tv } from "tailwind-variants";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { validationSchema } from "@/validation/registerSchema";

import Image from "next/image";
import img from "@/assets/img/register/register.png";

import { TitleOne, FormContainer, Input, DefaultLink } from "@/components";

const registerTv = tv(
  {
    slots: {
      main: "flex-1 flex items-center justify-center bg-white ",
      section: "p-8 flex flex-col gap-16",
      loginPageDiv: "flex items-center gap-2",
      figure: "bg-sky-600",
      image: "w-10/12",
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
  },

  { responsiveVariants: ["md"] }
);

interface FormData extends z.input<typeof validationSchema> {}

const Register = () => {
  const {
    handleSubmit,
    formState: { errors, isSubmitting },
    register,
  } = useForm<FormData>({
    resolver: zodResolver(validationSchema),
    mode: "onBlur",
    defaultValues: {
      name: "",
      email: "",
      use_type: "",
      password: "",
      confirm_password: "",
    },
  });

  const { main, section, loginPageDiv, figure, image } = registerTv({
    responsive: { initial: "mobile", md: "medium" },
  });

  const handleOnSubmit = async (data: FormData) => {
    console.log(data);
  };

  return (
    <>
      <main className={main()}>
        <section className={section()}>
          <TitleOne>Cadastre-se</TitleOne>

          <FormContainer
            isSubmitting={isSubmitting}
            onSubmit={handleSubmit(handleOnSubmit)}
            buttonLabel="Cadastrar"
          >
            <Input.Root>
              <Input.Div>
                <Input.Field
                  {...register("name")}
                  placeholder="Seu nome aqui"
                  autoFocus
                />
              </Input.Div>

              <Input.HelperText error={errors?.name && errors?.name.message} />
            </Input.Root>

            <Input.Root>
              <Input.Div>
                <Input.Field
                  {...register("email")}
                  type="email"
                  placeholder="Seu email aqui"
                />
              </Input.Div>

              <Input.HelperText
                error={errors?.email && errors?.email.message}
              />
            </Input.Root>

            <Input.Root>
              <Input.Div>
                <Input.FieldSelect
                  {...register("use_type")}
                  optionsArray={[
                    {
                      label: "Estudo",
                      value: "1",
                    },
                    {
                      label: "Trabalho",
                      value: "2",
                    },
                    {
                      label: "Trabalho e Estudo",
                      value: "3",
                    },
                  ]}
                />
              </Input.Div>

              <Input.HelperText
                error={errors?.use_type && errors?.use_type.message}
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

            <Input.Root>
              <Input.Div>
                <Input.FieldPassword
                  {...register("confirm_password")}
                  placeholder="Confirme sua senha aqui"
                />
              </Input.Div>

              <Input.HelperText
                error={
                  errors?.confirm_password && errors?.confirm_password.message
                }
              />
            </Input.Root>
          </FormContainer>

          <div className={loginPageDiv()}>
            <p>Já tem uma conta?</p>

            <DefaultLink href="/">Logar</DefaultLink>
          </div>
        </section>
      </main>

      <figure className={figure()}>
        <Image
          className={image()}
          src={img}
          alt="Figura de usuário se cadastrando"
        />
      </figure>
    </>
  );
};

export default Register;

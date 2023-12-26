"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { validationSchema } from "./validationSchema";
import { FaEye, FaEyeSlash } from "react-icons/fa";

import Image from "next/image";
import img from "@/assets/img/register/register.png";

import {
  Title,
  FormContainer,
  Input,
  TextSmall,
  LinkSmall,
} from "@/components";

interface FormData {
  name: string;
  email: string;
  use_type: string;
  password: string;
  confirm_password: string;
}

const Register = () => {
  const {
    handleSubmit,
    formState: { errors },
    register,
  } = useForm<FormData>({
    resolver: zodResolver(validationSchema),
    defaultValues: {
      name: "",
      email: "",
      use_type: "",
      password: "",
      confirm_password: "",
    },
  });

  const [passwordVisible, setPasswordVisible] = useState<boolean>(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] =
    useState<boolean>(false);

  const handleOnSubmit = async (data: FormData) => {
    console.log(data);
  };

  return (
    <>
      <main className="bg-white flex-1 flex items-center justify-center">
        <section className="p-8 flex flex-col gap-16">
          <Title.One text="Cadastre-se" />

          <FormContainer
            onSubmit={handleSubmit(handleOnSubmit)}
            buttonLabel="Cadastrar"
          >
            <Input.Root>
              <Input.Div>
                <input
                  type="text"
                  placeholder="Seu nome aqui"
                  {...register("name")}
                />
              </Input.Div>

              <Input.HelperText error={errors?.name && errors?.name.message} />
            </Input.Root>

            <Input.Root>
              <Input.Div>
                <input
                  type="email"
                  placeholder="Seu email aqui"
                  {...register("email")}
                />
              </Input.Div>

              <Input.HelperText
                error={errors?.email && errors?.email.message}
              />
            </Input.Root>

            <Input.Root>
              <Input.Div>
                <select {...register("use_type")}>
                  <option value="" disabled>
                    Selecione
                  </option>
                  <option value="1">Estudo</option>
                  <option value="2">Trabalho</option>
                  <option value="3">Trabalho e Estudo</option>
                </select>
              </Input.Div>

              <Input.HelperText
                error={errors?.use_type && errors?.use_type.message}
              />
            </Input.Root>

            <Input.Root>
              <Input.Div>
                <input
                  type={passwordVisible ? "text" : "password"}
                  placeholder="Sua senha aqui"
                  {...register("password")}
                />

                <Input.Icon
                  onClick={(): void => setPasswordVisible(!passwordVisible)}
                  icon={passwordVisible ? FaEyeSlash : FaEye}
                />
              </Input.Div>

              <Input.HelperText
                error={errors?.password && errors?.password.message}
              />
            </Input.Root>

            <Input.Root>
              <Input.Div>
                <input
                  type={confirmPasswordVisible ? "text" : "password"}
                  placeholder="Confirme sua senha aqui"
                  {...register("confirm_password")}
                />

                <Input.Icon
                  onClick={(): void =>
                    setConfirmPasswordVisible(!confirmPasswordVisible)
                  }
                  icon={confirmPasswordVisible ? FaEyeSlash : FaEye}
                />
              </Input.Div>

              <Input.HelperText
                error={
                  errors?.confirm_password && errors?.confirm_password.message
                }
              />
            </Input.Root>
          </FormContainer>

          <div className="flex gap-2">
            <TextSmall text="Já tem uma conta?" />

            <LinkSmall text="Logar" href="/login" />
          </div>
        </section>
      </main>

      <figure className="bg-sky-600 flex-1 flex items-center justify-center tablet:hidden">
        <Image
          className="w-10/12"
          src={img}
          alt="Figura de usuário se cadastrando"
        />
      </figure>
    </>
  );
};

export default Register;

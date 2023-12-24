"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { validationSchema } from "./validationSchema";
import { FaEye, FaEyeSlash } from "react-icons/fa";

import Image from "next/image";
import img from "@/assets/img/login/login.svg";

import { Title, FormContainer, Input } from "@/components";

interface FormData {
  email: string;
  password: string;
}
const Login = () => {
  const {
    handleSubmit,
    formState: { errors },
    register,
  } = useForm<FormData>({
    resolver: zodResolver(validationSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const [isVisible, setVisible] = useState<boolean>(false);

  const handleOnSubmit = async (data: FormData) => {
    console.log(data);
  };
  return (
    <div className="flex items-stretch w-full max-w-[125rem] h-full max-h-[75rem]">
      <figure className="bg-sky-600 flex-1 flex items-center justify-center tablet:hidden">
        <Image className="w-10/12" src={img} alt="Figura de usuário entrando" />
      </figure>

      <main className="bg-white flex-1 flex items-center justify-center">
        <section className="p-8 flex flex-col gap-16">
          <Title.Root>
            <Title.One text="Login" />
          </Title.Root>
          <FormContainer
            onSubmit={handleSubmit(handleOnSubmit)}
            buttonLabel="Logar"
          >
            <Input.Root>
              <Input.Div>
                <input
                  type="email"
                  {...register("email")}
                  placeholder="Seu email aqui"
                />
              </Input.Div>

              <Input.HelperText
                error={errors?.email && errors?.email.message}
              />
            </Input.Root>

            <Input.Root>
              <Input.Div>
                <input
                  type={isVisible ? "text" : "password"}
                  {...register("password")}
                  placeholder="Sua senha aqui"
                />

                <Input.Icon
                  onClick={(): void => setVisible(!isVisible)}
                  icon={isVisible ? FaEyeSlash : FaEye}
                />
              </Input.Div>

              <Input.HelperText
                error={errors?.password && errors?.password.message}
              />
            </Input.Root>

            {/* <RememberContainer>
        <RememberLabel htmlFor="remember">
          <input
            type="checkbox"
            name="remember"
            id="remember"
            onChange={(): void => setRemember(!remember)}
          />
          <span> Lembrar de mim</span>
        </RememberLabel>

        <p>
          <Link to="#">Esqueceu sua senha?</Link>
        </p>
      </RememberContainer>  */}
          </FormContainer>
        </section>
      </main>
    </div>
  );
};

export default Login;

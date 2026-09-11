"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { validationSchema } from "@/validation/mascot-schema";

import { Form, Input, Button } from "@/components";
import { useToast } from "@/providers/toast-context";

import { updateMascotAction } from "@/features/focus/actions";
import { IMascotState, MascotPersonality } from "@/features/focus/domain";

import styles from "./mascot-settings.module.css";

interface FormData {
  name: string;
  personality: MascotPersonality;
}

const PERSONALITY_OPTIONS = [
  { label: "Afetuoso", value: "afetuoso" },
  { label: "Sarcástico", value: "sarcastico" },
];

export function MascotSettings({ mascot }: { mascot: IMascotState }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    handleSubmit,
    register,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    mode: "onChange",
    resolver: zodResolver(validationSchema),
    defaultValues: {
      name: mascot.name,
      personality: mascot.personality,
    },
  });

  async function handleFormSubmit(data: FormData) {
    setSubmitError(null);

    const result = await updateMascotAction(data);

    if (result.error) {
      setSubmitError(result.error);
      return;
    }

    showToast("Mascote atualizado!");
    router.refresh();
  }

  return (
    <Form.Root onSubmit={handleSubmit(handleFormSubmit)} className={styles.form}>
      <Form.Wrapper>
        <Input.Root sharedProps={{ error: errors.name?.message }}>
          <Input.Label>Nome do mascote</Input.Label>
          <Input.Wrapper>
            <Input.Field {...register("name")} placeholder="Chunchumaru" />
          </Input.Wrapper>
          <Input.HelperText />
        </Input.Root>

        <Input.Root sharedProps={{ error: errors.personality?.message }}>
          <Input.Label>Personalidade</Input.Label>
          <Input.Wrapper>
            <Input.FieldSelect {...register("personality")} optionsArray={PERSONALITY_OPTIONS} />
          </Input.Wrapper>
          <Input.HelperText />
        </Input.Root>
      </Form.Wrapper>

      {submitError && <p className={styles.formError}>{submitError}</p>}

      <Button.Root loading={isSubmitting}>Salvar</Button.Root>
    </Form.Root>
  );
}

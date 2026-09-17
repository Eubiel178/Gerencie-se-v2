"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { validationSchema } from "@/validation/mascot-schema";

import { Form, Input, Button } from "@/components";
import { useToast } from "@/providers/toast-context";

import { updateMascotAction } from "@/features/focus/actions";
import { IMascotState, MascotPersonality, MascotSpecies } from "@/features/focus/domain";
import { MascotPreview, characterIdForSpecies } from "@/features/mascot-pet";

import styles from "./styles.module.css";

interface FormData {
  name: string;
  personality: MascotPersonality;
  species: MascotSpecies;
}

const PERSONALITY_OPTIONS = [
  { label: "Afetuoso", value: "afetuoso" },
  { label: "Sarcástico", value: "sarcastico" },
  { label: "Engraçado", value: "engracado" },
  { label: "Motivador", value: "motivador" },
  { label: "Zen", value: "zen" },
];

const SPECIES_OPTIONS = [
  { label: "Gato", value: "gato" },
  { label: "Shiba", value: "cachorro" },
  { label: "Pássaro", value: "passaro" },
  { label: "Urso", value: "urso" },
  { label: "Raposa", value: "raposa" },
  { label: "Panda", value: "panda" },
  { label: "Golden Retriever", value: "golden" },
  { label: "Akita", value: "akita" },
  { label: "Dogue Alemão", value: "dogue-alemao" },
  { label: "Gato Preto", value: "gato-preto" },
  { label: "Gato Angorá", value: "gato-angora" },
  { label: "Gato Cinza", value: "gato-tabby" },
  { label: "Gato Laranja", value: "gato-laranja" },
  { label: "Gato Lilás", value: "gato-lilas" },
  { label: "Gato Siamês", value: "gato-siames" },
];

export function MascotSettings({ mascot }: { mascot: IMascotState }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    handleSubmit,
    register,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    mode: "onChange",
    resolver: zodResolver(validationSchema),
    defaultValues: {
      name: mascot.name,
      personality: mascot.personality,
      species: mascot.species,
    },
  });

  const previewSpecies = useWatch({ control, name: "species" });

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
      <div className={styles.preview}>
        <MascotPreview characterId={characterIdForSpecies(previewSpecies)} scale={1.3} />
      </div>

      <Form.Wrapper>
        <Input.Root sharedProps={{ error: errors.name?.message }}>
          <Input.Label htmlFor="name">Nome do mascote</Input.Label>
          <Input.Wrapper>
            <Input.Field {...register("name")} placeholder="Chunchumaru" />
          </Input.Wrapper>
          <Input.HelperText />
        </Input.Root>

        <Input.Root sharedProps={{ error: errors.personality?.message }}>
          <Input.Label htmlFor="personality">Personalidade</Input.Label>
          <Input.Wrapper>
            <Input.FieldSelect {...register("personality")} optionsArray={PERSONALITY_OPTIONS} />
          </Input.Wrapper>
          <Input.HelperText />
        </Input.Root>

        <Input.Root sharedProps={{ error: errors.species?.message }}>
          <Input.Label htmlFor="species">Espécie</Input.Label>
          <Input.Wrapper>
            <Input.FieldSelect {...register("species")} optionsArray={SPECIES_OPTIONS} />
          </Input.Wrapper>
          <Input.HelperText />
        </Input.Root>
      </Form.Wrapper>

      {submitError && <p className={styles.formError}>{submitError}</p>}

      <Button.Root loading={isSubmitting}>Salvar</Button.Root>
    </Form.Root>
  );
}

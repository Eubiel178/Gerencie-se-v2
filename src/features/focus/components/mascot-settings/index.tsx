"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { validationSchema } from "@/validation/mascot-schema";

import { Form, Input, Button } from "@/components";
import { useToast } from "@/providers/toast-context";

import { updateMascotAction } from "@/features/focus/actions";
import { IMascotState, MascotPersonality, MascotRenderMode, MascotSpecies } from "@/features/focus/domain";
import { MascotVisual } from "@/features/focus/components/mascot-3d";

import styles from "./mascot-settings.module.css";

interface FormData {
  name: string;
  personality: MascotPersonality;
  species: MascotSpecies;
  renderMode: MascotRenderMode;
}

const PERSONALITY_OPTIONS = [
  { label: "Afetuoso", value: "afetuoso" },
  { label: "Sarcástico", value: "sarcastico" },
  { label: "Engraçado", value: "engracado" },
  { label: "Motivador", value: "motivador" },
  { label: "Zen", value: "zen" },
];

const SPECIES_OPTIONS = [
  { label: "Bolinha", value: "blob" },
  { label: "Gato", value: "gato" },
  { label: "Cachorro", value: "cachorro" },
];

const RENDER_MODE_OPTIONS = [
  { label: "Desenho (CSS)", value: "2d" },
  { label: "3D (beta)", value: "3d" },
];

export function MascotSettings({ mascot }: { mascot: IMascotState }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    handleSubmit,
    register,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    mode: "onChange",
    resolver: zodResolver(validationSchema),
    defaultValues: {
      name: mascot.name,
      personality: mascot.personality,
      species: mascot.species,
      renderMode: mascot.renderMode,
    },
  });

  const previewSpecies = watch("species");
  const previewRenderMode = watch("renderMode");

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
        <MascotVisual species={previewSpecies} mood="idle" level={mascot.level} renderMode={previewRenderMode} />
      </div>

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

        <Input.Root sharedProps={{ error: errors.species?.message }}>
          <Input.Label>Espécie</Input.Label>
          <Input.Wrapper>
            <Input.FieldSelect {...register("species")} optionsArray={SPECIES_OPTIONS} />
          </Input.Wrapper>
          <Input.HelperText />
        </Input.Root>

        <Input.Root sharedProps={{ error: errors.renderMode?.message }}>
          <Input.Label>Visual</Input.Label>
          <Input.Wrapper>
            <Input.FieldSelect {...register("renderMode")} optionsArray={RENDER_MODE_OPTIONS} />
          </Input.Wrapper>
          <p className={styles.hint}>
            O 3D é opcional — se o navegador não suportar, o desenho original aparece no lugar.
          </p>
          <Input.HelperText />
        </Input.Root>
      </Form.Wrapper>

      {submitError && <p className={styles.formError}>{submitError}</p>}

      <Button.Root loading={isSubmitting}>Salvar</Button.Root>
    </Form.Root>
  );
}

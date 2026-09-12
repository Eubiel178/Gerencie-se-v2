"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { validationSchema } from "@/validation/mascot-schema";

import { Form, Input, Button } from "@/components";
import { useToast } from "@/providers/toast-context";

import { updateMascotAction } from "@/features/focus/actions";
import {
  IMascotState,
  MascotBreed,
  MascotPersonality,
  MascotSpecies,
  breedsForSpecies,
} from "@/features/focus/domain";
import { MascotSprite } from "@/features/focus/components/mascot-sprite";

import styles from "./mascot-settings.module.css";

interface FormData {
  name: string;
  personality: MascotPersonality;
  species: MascotSpecies;
  breed: MascotBreed;
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
  { label: "Cachorro", value: "cachorro" },
  { label: "Coelho", value: "coelho" },
  { label: "Galinha", value: "galinha" },
];

const BREED_LABEL: Record<MascotBreed, string> = {
  cinza: "Cinza",
  laranja: "Laranja",
  "vira-lata": "Vira-lata",
  comum: "Comum",
  preta: "Preta",
};

export function MascotSettings({ mascot }: { mascot: IMascotState }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    handleSubmit,
    register,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    mode: "onChange",
    resolver: zodResolver(validationSchema),
    defaultValues: {
      name: mascot.name,
      personality: mascot.personality,
      species: mascot.species,
      breed: mascot.breed,
    },
  });

  const previewSpecies = watch("species");
  const previewBreed = watch("breed");
  const breedOptions = breedsForSpecies(previewSpecies).map((breed) => ({
    label: BREED_LABEL[breed as MascotBreed] ?? breed,
    value: breed,
  }));

  // Troca de espécie pode deixar a raça atual inválida (ex.: "laranja"
  // não existe pra coelho) — sempre que isso acontece, cai pra primeira
  // raça válida da nova espécie em vez de deixar o formulário num estado
  // inconsistente.
  useEffect(() => {
    const validBreeds = breedsForSpecies(previewSpecies);
    if (!(validBreeds as readonly string[]).includes(previewBreed)) {
      setValue("breed", validBreeds[0] as MascotBreed, { shouldValidate: true });
    }
  }, [previewSpecies, previewBreed, setValue]);

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
        <MascotSprite species={previewSpecies} breed={previewBreed} mood="idle" />
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

        <Input.Root sharedProps={{ error: errors.breed?.message }}>
          <Input.Label>Raça</Input.Label>
          <Input.Wrapper>
            <Input.FieldSelect {...register("breed")} optionsArray={breedOptions} />
          </Input.Wrapper>
          <Input.HelperText />
        </Input.Root>
      </Form.Wrapper>

      {submitError && <p className={styles.formError}>{submitError}</p>}

      <Button.Root loading={isSubmitting}>Salvar</Button.Root>
    </Form.Root>
  );
}

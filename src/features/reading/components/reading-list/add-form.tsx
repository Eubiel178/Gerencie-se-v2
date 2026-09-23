"use client";

import { useState } from "react";

import { useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";

import { Button, CollapsibleSection, Input } from "@/components";
import { createReadingItemAction } from "@/features/reading/actions";
import type { IReadingItem } from "@/features/reading/domain";
import { createReadingItemSchema } from "@/validation/reading-schema";

import styles from "../shared/styles.module.css";

interface AddFormProps {
  onCreated: (item: IReadingItem) => void;
  onCancel: () => void;
}

type FormData = {
  title: string;
  author: string;
  totalPages: number | null;
  currentPage: number | null;
  dailyReadingGoal: number | null;
};

export function AddForm({ onCreated, onCancel }: AddFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<FormData>({
    mode: "onChange",
    resolver: zodResolver(createReadingItemSchema),
    defaultValues: {
      title: "",
      author: "",
      totalPages: null,
      currentPage: null,
      dailyReadingGoal: null,
    },
  });

  const handleSubmit = form.handleSubmit(async (data) => {
    setSubmitError(null);

    const result = await createReadingItemAction({
      title: data.title.trim(),
      author: data.author?.trim() || null,
      totalPages: data.totalPages,
      currentPage: data.currentPage,
      dailyReadingGoal: data.dailyReadingGoal,
    });

    if (result.error) {
      setSubmitError(result.error);
      return;
    }

    form.reset();
    if (result.item) onCreated(result.item);
  });

  return (
    <form className={styles.addForm} onSubmit={handleSubmit}>
      <div className={styles.addFormHeading}>
        <div>
          <h2>Adicionar à estante</h2>
          <p>
            Comece só com o título. Páginas e meta diária ficam nas opções
            abaixo.
          </p>
        </div>
        <button
          type="button"
          className={styles.cancelAddButton}
          onClick={onCancel}
        >
          Cancelar
        </button>
      </div>
      <div className={styles.primaryFields}>
        <Input.Root>
          <Input.Label htmlFor="reading-title">Título</Input.Label>
          <Input.Wrapper>
            <Input.Field
              id="reading-title"
              {...form.register("title")}
              placeholder="Ex.: O avesso da pele"
            />
          </Input.Wrapper>
        </Input.Root>
        <Input.Root>
          <Input.Label htmlFor="reading-author">
            Autor <span aria-hidden="true">(opcional)</span>
          </Input.Label>
          <Input.Wrapper>
            <Input.Field
              id="reading-author"
              {...form.register("author")}
              placeholder="Nome do autor"
            />
          </Input.Wrapper>
        </Input.Root>
        <Button.Root type="submit" loading={form.formState.isSubmitting}>
          Salvar
        </Button.Root>
      </div>

      <CollapsibleSection label="Mais opções de leitura">
        <div className={styles.optionalFields}>
          <Input.Root>
            <Input.Label htmlFor="reading-total-pages">
              Total de páginas
            </Input.Label>
            <Input.Wrapper>
              <Input.Field
                id="reading-total-pages"
                type="number"
                min={1}
                inputMode="numeric"
                placeholder="Ex.: 320"
                {...form.register("totalPages", { valueAsNumber: true })}
              />
            </Input.Wrapper>
          </Input.Root>
          <Input.Root>
            <Input.Label htmlFor="reading-current-page">
              Página atual
            </Input.Label>
            <Input.Wrapper>
              <Input.Field
                id="reading-current-page"
                type="number"
                min={0}
                inputMode="numeric"
                placeholder="Ex.: 64"
                {...form.register("currentPage", { valueAsNumber: true })}
              />
            </Input.Wrapper>
          </Input.Root>
          <Input.Root>
            <Input.Label htmlFor="reading-daily-goal">
              Meta diária <span aria-hidden="true">(opcional)</span>
            </Input.Label>
            <Input.Wrapper>
              <Input.Field
                id="reading-daily-goal"
                type="number"
                min={1}
                inputMode="numeric"
                placeholder="Páginas por dia"
                {...form.register("dailyReadingGoal", { valueAsNumber: true })}
              />
            </Input.Wrapper>
          </Input.Root>
        </div>
      </CollapsibleSection>

      {(submitError || form.formState.errors.root) && (
        <p className={styles.formError}>
          {submitError || form.formState.errors.root?.message}
        </p>
      )}
    </form>
  );
}

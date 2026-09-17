"use client";

import { useState } from "react";


import { Button, CollapsibleSection, Input } from "@/components";

import { createReadingItemAction } from "@/features/reading/actions";
import type { IReadingItem } from "@/features/reading/domain";

import styles from "../shared/styles.module.css";

interface AddFormProps {
  onCreated: (item: IReadingItem) => void;
  onCancel: () => void;
}

export function AddForm({ onCreated, onCancel }: AddFormProps) {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [totalPages, setTotalPages] = useState("");
  const [currentPage, setCurrentPage] = useState("");
  const [dailyReadingGoal, setDailyReadingGoal] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError("Informe o título do livro.");
      return;
    }

    const parsedTotalPages = parseOptionalPageValue(totalPages, false);
    const parsedCurrentPage = parseOptionalPageValue(currentPage, true);
    const parsedDailyGoal = parseOptionalPageValue(dailyReadingGoal, false);

    if (
      parsedTotalPages === "invalid" ||
      parsedCurrentPage === "invalid" ||
      parsedDailyGoal === "invalid"
    ) {
      setError("Use números inteiros válidos nos campos de leitura.");
      return;
    }

    if (
      parsedTotalPages != null &&
      parsedCurrentPage != null &&
      parsedCurrentPage > parsedTotalPages
    ) {
      setError("A página atual não pode ser maior que o total de páginas.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await createReadingItemAction({
        title: trimmedTitle,
        author: author.trim() || null,
        totalPages: parsedTotalPages,
        currentPage: parsedCurrentPage,
        dailyReadingGoal: parsedDailyGoal,
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      setTitle("");
      setAuthor("");
      setTotalPages("");
      setCurrentPage("");
      setDailyReadingGoal("");
      if (result.item) onCreated(result.item);
    } finally {
      setIsSubmitting(false);
    }
  }

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
              name="reading-title"
              placeholder="Ex.: O avesso da pele"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
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
              name="reading-author"
              placeholder="Nome do autor"
              value={author}
              onChange={(event) => setAuthor(event.target.value)}
            />
          </Input.Wrapper>
        </Input.Root>
        <Button.Root type="submit" loading={isSubmitting}>
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
                name="reading-total-pages"
                type="number"
                min={1}
                inputMode="numeric"
                placeholder="Ex.: 320"
                value={totalPages}
                onChange={(event) => setTotalPages(event.target.value)}
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
                name="reading-current-page"
                type="number"
                min={0}
                inputMode="numeric"
                placeholder="Ex.: 64"
                value={currentPage}
                onChange={(event) => setCurrentPage(event.target.value)}
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
                name="reading-daily-goal"
                type="number"
                min={1}
                inputMode="numeric"
                placeholder="Páginas por dia"
                value={dailyReadingGoal}
                onChange={(event) => setDailyReadingGoal(event.target.value)}
              />
            </Input.Wrapper>
          </Input.Root>
        </div>
      </CollapsibleSection>

      {error && <p className={styles.formError}>{error}</p>}
    </form>
  );
}

function parseOptionalPageValue(
  value: string,
  allowZero: boolean,
): number | null | "invalid" {
  if (!value.trim()) return null;

  const parsed = Number(value);
  return Number.isInteger(parsed) && (allowZero ? parsed >= 0 : parsed > 0)
    ? parsed
    : "invalid";
}

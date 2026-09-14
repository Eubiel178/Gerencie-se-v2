"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { Button, Input } from "@/components";

import { createReadingItemAction } from "@/features/reading/actions";

import styles from "../../reading.module.css";

export function AddForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError("Informe o título do livro.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await createReadingItemAction({
        title: trimmedTitle,
        author: author.trim() || null,
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      setTitle("");
      setAuthor("");
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className={styles.addForm} onSubmit={handleSubmit}>
      <Input.Field
        aria-label="Título do livro"
        placeholder="Título do livro"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
      />
      <Input.Field
        aria-label="Autor"
        placeholder="Autor (opcional)"
        value={author}
        onChange={(event) => setAuthor(event.target.value)}
      />
      <Button.Root type="submit" loading={isSubmitting}>
        Adicionar
      </Button.Root>

      {error && <p className={styles.formError}>{error}</p>}
    </form>
  );
}

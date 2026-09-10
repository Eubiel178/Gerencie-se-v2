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

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    setIsSubmitting(true);

    try {
      await createReadingItemAction({ title: trimmedTitle, author: author.trim() || null });
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
        placeholder="Título do livro"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
      />
      <Input.Field
        placeholder="Autor (opcional)"
        value={author}
        onChange={(event) => setAuthor(event.target.value)}
      />
      <Button type="submit" loading={isSubmitting}>
        Adicionar
      </Button>
    </form>
  );
}

"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { Button, Input } from "@/components";

import { createHealthCheckupAction } from "@/features/health/actions";

import styles from "../health.module.css";

export function AddForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [intervalDays, setIntervalDays] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const trimmedTitle = title.trim();
    const trimmedCategory = category.trim();
    if (!trimmedTitle || !trimmedCategory) return;

    setIsSubmitting(true);

    try {
      await createHealthCheckupAction({
        title: trimmedTitle,
        category: trimmedCategory,
        intervalDays: intervalDays ? Number(intervalDays) : null,
        notes: null,
      });

      setTitle("");
      setCategory("");
      setIntervalDays("");
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className={styles.addForm} onSubmit={handleSubmit}>
      <Input.Field
        placeholder="Ex.: Exame de vista"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
      />
      <Input.Field
        placeholder="Categoria (ex.: Check-up)"
        value={category}
        onChange={(event) => setCategory(event.target.value)}
      />
      <Input.Field
        type="number"
        min={1}
        placeholder="A cada quantos dias (opcional)"
        value={intervalDays}
        onChange={(event) => setIntervalDays(event.target.value)}
      />
      <Button type="submit" loading={isSubmitting}>
        Adicionar
      </Button>
    </form>
  );
}

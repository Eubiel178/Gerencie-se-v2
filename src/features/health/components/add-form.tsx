"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Alert, Button, Input } from "@/components";

import { createHealthCheckupAction } from "@/features/health/actions";
import { healthCheckupFormSchema, HealthCheckupFormData } from "@/validation/health-schema";

import styles from "../health.module.css";

export function AddForm() {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<HealthCheckupFormData>({
    mode: "onChange",
    resolver: zodResolver(healthCheckupFormSchema),
    defaultValues: { title: "", category: "", intervalDays: "", notes: "" },
  });

  async function onSubmit(data: HealthCheckupFormData) {
    setSubmitError(null);

    const result = await createHealthCheckupAction({
      title: data.title,
      category: data.category,
      intervalDays: data.intervalDays ? Number(data.intervalDays) : null,
      notes: null,
    });

    if (result.error) {
      setSubmitError(result.error);
      return;
    }

    reset();
    router.refresh();
  }

  return (
    <form className={styles.addForm} onSubmit={handleSubmit(onSubmit)}>
      <Input.Root sharedProps={{ error: errors.title?.message }}>
        <Input.Wrapper>
          <Input.Field
            {...register("title")}
            aria-label="Nome do cuidado"
            placeholder="Ex.: Exame de vista"
          />
        </Input.Wrapper>
        <Input.HelperText />
      </Input.Root>

      <Input.Root sharedProps={{ error: errors.category?.message }}>
        <Input.Wrapper>
          <Input.Field
            {...register("category")}
            aria-label="Categoria"
            placeholder="Categoria (ex.: Check-up)"
          />
        </Input.Wrapper>
        <Input.HelperText />
      </Input.Root>

      <Input.Root sharedProps={{ error: errors.intervalDays?.message }}>
        <Input.Wrapper>
          <Input.Field
            {...register("intervalDays")}
            type="number"
            min={1}
            aria-label="Intervalo em dias entre repetições"
            placeholder="A cada quantos dias (opcional)"
          />
        </Input.Wrapper>
        <Input.HelperText />
      </Input.Root>

      <Button.Root type="submit" loading={isSubmitting}>
        Adicionar
      </Button.Root>

      {submitError && <Alert variant="error">{submitError}</Alert>}
    </form>
  );
}

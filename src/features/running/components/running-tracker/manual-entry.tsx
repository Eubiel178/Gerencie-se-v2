"use client";

import { useState } from "react";

import { useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button, Input } from "@/components";
import { createRunningSessionAction } from "@/features/running/actions";
import { IRunningSession } from "@/features/running/domain";

import styles from "./styles.module.css";

const manualEntrySchema = z.object({
  distanceKm: z.number().positive("Informe uma distância válida."),
  minutes: z.number().positive("Informe um tempo válido."),
});

type ManualEntryData = z.infer<typeof manualEntrySchema>;

export function ManualEntry({ onSaved }: { onSaved: (session: IRunningSession) => void }) {
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<ManualEntryData>({
    mode: "onChange",
    resolver: zodResolver(manualEntrySchema),
    defaultValues: {
      distanceKm: 0,
      minutes: 0,
    },
  });

  const handleSubmit = form.handleSubmit(async (data) => {
    setSubmitError(null);

    const result = await createRunningSessionAction({
      distanceMeters: Math.round(data.distanceKm * 1000),
      durationSeconds: Math.round(data.minutes * 60),
      source: "manual",
    });

    if (result.error) {
      setSubmitError(result.error);
      return;
    }

    form.reset();
    if (result.session) onSaved(result.session);
  });

  return (
    <form className={styles.panel} onSubmit={handleSubmit}>
      <div className={styles.fieldsRow}>
        <Input.Root sharedProps={{ error: form.formState.errors.distanceKm?.message }}>
          <Input.Label htmlFor="distanceKm">Distância (km)</Input.Label>
          <Input.Wrapper>
            <Input.Field
              type="number"
              step="0.01"
              min={0}
              {...form.register("distanceKm", { valueAsNumber: true })}
            />
          </Input.Wrapper>
          <Input.HelperText />
        </Input.Root>

        <Input.Root sharedProps={{ error: form.formState.errors.minutes?.message }}>
          <Input.Label htmlFor="minutes">Tempo (minutos)</Input.Label>
          <Input.Wrapper>
            <Input.Field
              type="number"
              step="0.1"
              min={0}
              {...form.register("minutes", { valueAsNumber: true })}
            />
          </Input.Wrapper>
          <Input.HelperText />
        </Input.Root>
      </div>

      {submitError && <p className={styles.inlineMessage}>{submitError}</p>}

      <Button.Root loading={form.formState.isSubmitting}>Salvar corrida</Button.Root>
    </form>
  );
}

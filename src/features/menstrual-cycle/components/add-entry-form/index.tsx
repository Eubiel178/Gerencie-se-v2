"use client";

import { useState } from "react";

import { useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button, Input } from "@/components";
import { createCycleEntryAction } from "@/features/menstrual-cycle/actions";
import { ICycleEntry } from "@/features/menstrual-cycle/domain";
import { todayForDateInput } from "@/utils";

import styles from "./styles.module.css";

const COMMON_SYMPTOMS = ["Cólica", "Dor de cabeça", "Inchaço", "Fadiga", "Mudança de humor"];

const addEntrySchema = z.object({
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Informe uma data válida (AAAA-MM-DD)")
    .refine((value) => !Number.isNaN(new Date(value).getTime()), "Informe uma data válida"),
  periodLengthDays: z
    .number()
    .int()
    .positive("Duração deve ser maior que zero")
    .max(30, "Duração muito alta")
    .optional()
    .nullable(),
  symptoms: z.array(z.string().max(60)).max(30, "Muitos sintomas"),
});

type AddEntryData = z.infer<typeof addEntrySchema>;

interface AddEntryFormProps {
  onAdd: (entry: ICycleEntry) => void;
}

export function AddEntryForm({ onAdd }: AddEntryFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<AddEntryData>({
    mode: "onChange",
    resolver: zodResolver(addEntrySchema),
    defaultValues: {
      startDate: todayForDateInput(),
      periodLengthDays: null,
      symptoms: [],
    },
  });

  const symptoms = form.watch("symptoms");

  function toggleSymptom(symptom: string) {
    const current = form.getValues("symptoms");
    form.setValue(
      "symptoms",
      current.includes(symptom) ? current.filter((s) => s !== symptom) : [...current, symptom],
      { shouldValidate: true }
    );
  }

  const handleSubmit = form.handleSubmit(async (data) => {
    setSubmitError(null);

    const result = await createCycleEntryAction({
      ...data,
      notes: null,
    });

    if (result.error || !result.id) {
      setSubmitError(result.error ?? "Não foi possível salvar o registro.");
      return;
    }

    onAdd({
      id: result.id,
      userId: "",
      startDate: data.startDate,
      periodLengthDays: data.periodLengthDays ?? null,
      symptoms: data.symptoms,
      notes: null,
      createdAt: new Date(),
    });
    form.reset({
      startDate: todayForDateInput(),
      periodLengthDays: null,
      symptoms: [],
    });
  });

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <Input.Root sharedProps={{ error: form.formState.errors.startDate?.message }}>
        <Input.Label htmlFor="startDate">Início do ciclo</Input.Label>
        <Input.Wrapper>
          <Input.Field
            type="date"
            {...form.register("startDate")}
          />
        </Input.Wrapper>
        <Input.HelperText />
      </Input.Root>

      <Input.Root sharedProps={{ error: form.formState.errors.periodLengthDays?.message }}>
        <Input.Label htmlFor="periodLengthDays">Duração do período em dias (opcional)</Input.Label>
        <Input.Wrapper>
          <Input.Field
            type="number"
            min={1}
            {...form.register("periodLengthDays", {
              // Campo opcional: `valueAsNumber` transforma "" (vazio) em
              // NaN, não em null/undefined — e `z.number()` rejeita NaN,
              // bloqueando o envio sem nenhum aviso quando o campo fica
              // em branco (que é justamente o caso normal de "opcional").
              setValueAs: (value) => (value === "" ? null : Number(value)),
            })}
          />
        </Input.Wrapper>
        <Input.HelperText />
      </Input.Root>

      <div className={styles.symptoms}>
        {COMMON_SYMPTOMS.map((symptom) => (
          <button
            key={symptom}
            type="button"
            className={`${styles.symptomChip} ${symptoms.includes(symptom) ? styles.symptomChipActive : ""}`}
            onClick={() => toggleSymptom(symptom)}
          >
            {symptom}
          </button>
        ))}
      </div>

      {submitError && <p className={styles.formError}>{submitError}</p>}

      <Button.Root type="submit" loading={form.formState.isSubmitting}>
        Registrar
      </Button.Root>
    </form>
  );
}

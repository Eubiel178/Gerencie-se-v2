"use client";

import { useState } from "react";

import { Button, Input } from "@/components";

import { createCycleEntryAction } from "@/features/menstrual-cycle/actions";
import { todayForDateInput } from "@/utils";
import { ICycleEntry } from "@/features/menstrual-cycle/domain";

import styles from "./styles.module.css";

const COMMON_SYMPTOMS = ["Cólica", "Dor de cabeça", "Inchaço", "Fadiga", "Mudança de humor"];

interface AddEntryFormProps {
  onAdd: (entry: ICycleEntry) => void;
}

export function AddEntryForm({ onAdd }: AddEntryFormProps) {
  const [startDate, setStartDate] = useState(todayForDateInput);
  const [periodLengthDays, setPeriodLengthDays] = useState("");
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleSymptom(symptom: string) {
    setSymptoms((current) =>
      current.includes(symptom) ? current.filter((s) => s !== symptom) : [...current, symptom]
    );
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!startDate) {
      setError("Informe a data de início.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await createCycleEntryAction({
        startDate,
        periodLengthDays: periodLengthDays ? Number(periodLengthDays) : null,
        symptoms,
        notes: null,
      });

      if (result.error || !result.id) {
        setError(result.error ?? "Não foi possível salvar o registro.");
        return;
      }

      onAdd({
        id: result.id,
        userId: "",
        startDate,
        periodLengthDays: periodLengthDays ? Number(periodLengthDays) : null,
        symptoms,
        notes: null,
        createdAt: new Date(),
      });
      setStartDate(todayForDateInput());
      setPeriodLengthDays("");
      setSymptoms([]);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <Input.Root>
        <Input.Label htmlFor="startDate">Início do ciclo</Input.Label>
        <Input.Wrapper>
          <Input.Field
            name="startDate"
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
          />
        </Input.Wrapper>
      </Input.Root>

      <Input.Root>
        <Input.Label htmlFor="periodLengthDays">Duração do período em dias (opcional)</Input.Label>
        <Input.Wrapper>
          <Input.Field
            name="periodLengthDays"
            type="number"
            min={1}
            value={periodLengthDays}
            onChange={(event) => setPeriodLengthDays(event.target.value)}
          />
        </Input.Wrapper>
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

      {error && <p className={styles.formError}>{error}</p>}

      <Button.Root type="submit" loading={isSubmitting}>
        Registrar
      </Button.Root>
    </form>
  );
}

"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { Button, Input } from "@/components";

import { createCycleEntryAction } from "@/features/menstrual-cycle/actions";
import { todayForDateInput } from "@/utils";

import styles from "../cycle.module.css";

const COMMON_SYMPTOMS = ["Cólica", "Dor de cabeça", "Inchaço", "Fadiga", "Mudança de humor"];

export function AddEntryForm() {
  const router = useRouter();
  const [startDate, setStartDate] = useState(todayForDateInput);
  const [periodLengthDays, setPeriodLengthDays] = useState("");
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function toggleSymptom(symptom: string) {
    setSymptoms((current) =>
      current.includes(symptom) ? current.filter((s) => s !== symptom) : [...current, symptom]
    );
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!startDate) return;

    setIsSubmitting(true);

    try {
      await createCycleEntryAction({
        startDate,
        periodLengthDays: periodLengthDays ? Number(periodLengthDays) : null,
        symptoms,
        notes: null,
      });

      setStartDate(todayForDateInput());
      setPeriodLengthDays("");
      setSymptoms([]);
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <Input.Root>
        <Input.Label>Início do ciclo</Input.Label>
        <Input.Wrapper>
          <Input.Field
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
          />
        </Input.Wrapper>
      </Input.Root>

      <Input.Root>
        <Input.Label>Duração do período em dias (opcional)</Input.Label>
        <Input.Wrapper>
          <Input.Field
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

      <Button.Root type="submit" loading={isSubmitting}>
        Registrar
      </Button.Root>
    </form>
  );
}

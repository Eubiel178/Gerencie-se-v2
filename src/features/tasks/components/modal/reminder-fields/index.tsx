"use client";

import type { UseFormRegister, UseFormSetValue } from "react-hook-form";

import { Input } from "@/components";

import { FormData } from "../interfaces";
import { REMINDER_OPTIONS } from "@/validation/task-schema";

import styles from "./styles.module.css";

const RECURRENCE_OPTIONS = [
  { label: "Não repetir", value: "none" },
  { label: "Repetir diariamente", value: "daily" },
  { label: "Repetir semanalmente", value: "weekly" },
];

interface ReminderFieldsProps {
  register: UseFormRegister<FormData>;
  setValue: UseFormSetValue<FormData>;
  scheduledAtError?: string;
  hasScheduledAt: boolean;
}

/**
 * Data/hora da tarefa + lembretes — disponível para qualquer tarefa, não
 * só as sincronizadas com o Google Agenda (antes só existia dentro do
 * fluxo de sincronização). Lembrete só faz sentido com uma data marcada,
 * por isso as opções só aparecem depois de preenchida.
 *
 * Disparo real do lembrete acontece no navegador (ver
 * `features/tasks/components/reminder-scheduler`) — só funciona com o
 * Gerencie-se aberto, o que é avisado ali, não aqui no formulário.
 */
export function ReminderFields({ register, setValue, scheduledAtError, hasScheduledAt }: ReminderFieldsProps) {
  return (
    <div className={styles.fields}>
      <Input.Root sharedProps={{ error: scheduledAtError }}>
        <Input.Label htmlFor="scheduledAt">Concluir até (opcional)</Input.Label>

        <Input.Wrapper>
          <Input.Field
            {...register("scheduledAt", {
              onChange: (event) => {
                if (!event.target.value) setValue("reminderOffsetsMinutes", []);
              },
            })}
            type="datetime-local"
            id="scheduledAt"
          />
        </Input.Wrapper>

        <p className={styles.hint}>
          Defina o prazo. Depois você pode escolher lembretes e repetição, se precisar.
        </p>

        <Input.HelperText />
      </Input.Root>

      {hasScheduledAt && (
        <>
          <div className={styles.reminderGroup}>
            <p className={styles.reminderLabel}>Lembrar</p>

            <div className={styles.optionsRow}>
              {REMINDER_OPTIONS.map((option) => (
                <label key={option.value} className={styles.option}>
                  <input
                    type="checkbox"
                    value={option.value}
                    {...register("reminderOffsetsMinutes")}
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </div>

          <Input.Root>
            <Input.Label htmlFor="recurrence">Repetição</Input.Label>

            <Input.Wrapper>
              <Input.FieldSelect
                {...register("recurrence")}
                id="recurrence"
                optionsArray={RECURRENCE_OPTIONS}
              />
            </Input.Wrapper>
          </Input.Root>
        </>
      )}
    </div>
  );
}

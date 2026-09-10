"use client";

import type { UseFormRegister } from "react-hook-form";

import { Input, Paragraph, Wrapper } from "@/components";

import { FormData } from "../interfaces";

import styles from "./reminder-fields.module.css";

const REMINDER_OPTIONS = [
  { label: "1 dia antes", value: 1440 },
  { label: "5 minutos antes", value: 5 },
  { label: "Na hora", value: 0 },
];

interface ReminderFieldsProps {
  register: UseFormRegister<FormData>;
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
export function ReminderFields({ register, scheduledAtError, hasScheduledAt }: ReminderFieldsProps) {
  return (
    <Wrapper direction="column" gap="small">
      <Input.Root sharedProps={{ error: scheduledAtError }}>
        <Input.Label htmlFor="scheduledAt">Data e hora (opcional)</Input.Label>

        <Input.Wrapper>
          <Input.Field {...register("scheduledAt")} type="datetime-local" id="scheduledAt" />
        </Input.Wrapper>

        <Input.HelperText />
      </Input.Root>

      {hasScheduledAt && (
        <Wrapper direction="column" gap="small">
          <Paragraph size="small">Lembrar</Paragraph>

          <Wrapper gap="medium" align="center">
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
          </Wrapper>
        </Wrapper>
      )}
    </Wrapper>
  );
}

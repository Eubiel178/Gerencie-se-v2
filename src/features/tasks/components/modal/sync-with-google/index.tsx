"use client";

import { useRouter } from "next/navigation";
import type { UseFormRegister, UseFormSetValue } from "react-hook-form";

import { Button, Input } from "@/components";

import { FormData } from "../interfaces";

import styles from "./sync-with-google.module.css";

interface SyncWithGoogleProps {
  register: UseFormRegister<FormData>;
  setValue: UseFormSetValue<FormData>;
  isChecked: boolean;
  isGoogleConnected: boolean;
}

/**
 * Bloco "Sincronizar com Google Agenda" reaproveitado por AddTask e
 * EditTask. Regras (ver Fase 11 do plano):
 * - a checkbox nunca bloqueia salvar a tarefa — se o Google não estiver
 *   conectado, mostramos um aviso com um jeito de conectar, mas o usuário
 *   pode desmarcar e continuar criando/editando a tarefa normalmente;
 * - a data/hora em si é pedida por `ReminderFields` (campo geral da
 *   tarefa, não exclusivo do Google) — aqui só validamos que ela foi
 *   preenchida quando marcar sincronizar (ver `task-schema.ts`).
 */
export function SyncWithGoogle({
  register,
  setValue,
  isChecked,
  isGoogleConnected,
}: SyncWithGoogleProps) {
  const router = useRouter();

  return (
    <div className={styles.container}>
      <div className={styles.checkboxRow}>
        <Input.Wrapper>
          <Input.Field
            {...register("syncEnabled")}
            type="checkbox"
            id="syncEnabled"
          />
        </Input.Wrapper>

        <Input.Label htmlFor="syncEnabled">
          Sincronizar com Google Agenda
        </Input.Label>
      </div>

      {isChecked && !isGoogleConnected && (
        <div className={styles.notConnectedPanel}>
          <p className={styles.noticeText}>
            Para sincronizar esta tarefa com o Google Agenda, conecte sua
            conta Google.
          </p>

          <div className={styles.buttonsRow}>
            <Button.Root
              type="button"
              size="sm"
              onClick={() => router.push("/home/settings")}
            >
              Conectar Google Agenda
            </Button.Root>

            <Button.Root
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setValue("syncEnabled", false)}
            >
              Continuar sem sincronizar
            </Button.Root>
          </div>
        </div>
      )}
    </div>
  );
}

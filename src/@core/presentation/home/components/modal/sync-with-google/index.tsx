"use client";

import { useRouter } from "next/navigation";
import type { UseFormRegister, UseFormSetValue } from "react-hook-form";

import { Button, Input, Paragraph, Wrapper } from "@/components";

import { FormData } from "../interfaces";

interface SyncWithGoogleProps {
  register: UseFormRegister<FormData>;
  setValue: UseFormSetValue<FormData>;
  isChecked: boolean;
  isGoogleConnected: boolean;
  scheduledAtError?: string;
}

/**
 * Bloco "Sincronizar com Google Agenda" reaproveitado por AddTask e
 * EditTask. Regras (ver Fase 11 do plano):
 * - a checkbox nunca bloqueia salvar a tarefa — se o Google não estiver
 *   conectado, mostramos um aviso com um jeito de conectar, mas o usuário
 *   pode desmarcar e continuar criando/editando a tarefa normalmente;
 * - só pedimos data/hora quando a sincronização está de fato marcada E o
 *   Google já está conectado (sem conexão, não faz sentido pedir).
 */
export function SyncWithGoogle({
  register,
  setValue,
  isChecked,
  isGoogleConnected,
  scheduledAtError,
}: SyncWithGoogleProps) {
  const router = useRouter();

  return (
    <Wrapper direction="column" gap="small">
      <Wrapper gap="small" align="center">
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
      </Wrapper>

      {isChecked && !isGoogleConnected && (
        <Wrapper direction="column" gap="small" background="dark" padding="small">
          <Paragraph size="small">
            Para sincronizar esta tarefa com o Google Agenda, conecte sua
            conta Google.
          </Paragraph>

          <Wrapper gap="small" align="center">
            <Button
              type="button"
              size="small"
              onClick={() => router.push("/home/settings")}
            >
              Conectar Google Agenda
            </Button>

            <Button
              type="button"
              size="small"
              background="transparent"
              onClick={() => setValue("syncEnabled", false)}
            >
              Continuar sem sincronizar
            </Button>
          </Wrapper>
        </Wrapper>
      )}

      {isChecked && isGoogleConnected && (
        <Input.Root sharedProps={{ error: scheduledAtError }}>
          <Input.Label htmlFor="scheduledAt">Data e hora</Input.Label>

          <Input.Wrapper>
            <Input.Field
              {...register("scheduledAt")}
              type="datetime-local"
              id="scheduledAt"
            />
          </Input.Wrapper>

          <Input.HelperText />
        </Input.Root>
      )}
    </Wrapper>
  );
}

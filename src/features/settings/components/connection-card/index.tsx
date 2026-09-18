"use client";

import { useState } from "react";

import {
  disconnectGoogleCalendarAction,
  updateSelectedCalendarAction,
} from "@/features/google-calendar/actions";

import { Button, Input, Modal, ModalHeader } from "@/components";

import type { GoogleCalendarOption } from "@/lib/google-calendar";

import styles from "./styles.module.css";

interface ConnectionCardProps {
  isConnected: boolean;
  googleAccountEmail?: string;
  selectedCalendarId?: string;
  calendars: GoogleCalendarOption[];
}

/**
 * Mostra claramente a diferença entre "Conta" (login) e "Integração"
 * (Google Agenda) — o usuário nunca deve achar que logar com Google já deu
 * acesso à agenda. Ver também o texto fixo em `src/features/settings/index.tsx`.
 */
export function ConnectionCard({
  isConnected,
  googleAccountEmail,
  selectedCalendarId,
  calendars,
}: ConnectionCardProps) {
  const [isLocallyConnected, setIsLocallyConnected] = useState(isConnected);
  const [calendarId, setCalendarId] = useState(selectedCalendarId ?? "");
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isChangingCalendar, setIsChangingCalendar] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isConfirmingDisconnect, setIsConfirmingDisconnect] = useState(false);

  async function handleDisconnect() {
    setActionError(null);
    setIsDisconnecting(true);

    const result = await disconnectGoogleCalendarAction();

    setIsDisconnecting(false);
    setIsConfirmingDisconnect(false);

    if (result.error) {
      setActionError(result.error);
      return;
    }

    setIsLocallyConnected(false);
  }

  async function handleCalendarChange(event: React.ChangeEvent<HTMLSelectElement>) {
    setActionError(null);
    setIsChangingCalendar(true);

    const result = await updateSelectedCalendarAction(event.target.value);

    setIsChangingCalendar(false);

    if (result.error) {
      setActionError(result.error);
      return;
    }

    setCalendarId(event.target.value);
  }

  if (!isLocallyConnected) {
    return (
      <div className={styles.panel}>
        <div className={styles.statusRow}>
          <span aria-hidden="true">○</span>
          <p className={styles.statusText}>Não conectado</p>
        </div>

        <a href="/api/google-calendar/connect" className={styles.connectLink}>
          Conectar Google Agenda
        </a>
      </div>
    );
  }

  return (
    <div className={styles.panel}>
      <div className={styles.statusRow}>
        <span aria-hidden="true">●</span>
        <p className={styles.statusText}>Conectado</p>
      </div>

      <p className={styles.mutedText}>
        Conta: {googleAccountEmail}
      </p>

      <Input.Root>
        <Input.Label htmlFor="calendarId">Calendário</Input.Label>

        <Input.Wrapper>
          <Input.FieldSelect
            id="calendarId"
            value={calendarId}
            optionsArray={calendars.map((calendar) => ({
              label: calendar.primary ? `${calendar.summary} (principal)` : calendar.summary,
              value: calendar.id,
            }))}
            onChange={handleCalendarChange}
            disabled={isChangingCalendar}
          />
        </Input.Wrapper>
      </Input.Root>

      {actionError && <p className={styles.error}>{actionError}</p>}

      <div className={styles.buttonRow}>
        <Button.Root
          type="button"
          className={styles.disconnectButton}
          onClick={() => setIsConfirmingDisconnect(true)}
        >
          Desconectar
        </Button.Root>
      </div>

      {isConfirmingDisconnect && (
        <Modal onClose={() => setIsConfirmingDisconnect(false)}>
          <ModalHeader title="Confirmar" onClose={() => setIsConfirmingDisconnect(false)} />

          <p className={styles.confirmText}>
            Desconectar o Google Agenda? Suas tarefas marcadas para sincronizar
            deixam de aparecer no calendário até você conectar novamente.
          </p>

          <div className={styles.confirmActions}>
            <Button.Root type="button" variant="secondary" onClick={() => setIsConfirmingDisconnect(false)}>
              Cancelar
            </Button.Root>
            <Button.Root type="button" tone="danger" loading={isDisconnecting} onClick={handleDisconnect}>
              Confirmar
            </Button.Root>
          </div>
        </Modal>
      )}
    </div>
  );
}

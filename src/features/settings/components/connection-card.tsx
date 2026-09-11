"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  disconnectGoogleCalendarAction,
  updateSelectedCalendarAction,
} from "@/features/google-calendar/actions";

import { Button, Input } from "@/components";

import type { GoogleCalendarOption } from "@/lib/google-calendar";

import styles from "./connection-card.module.css";

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
  const router = useRouter();
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isChangingCalendar, setIsChangingCalendar] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  async function handleDisconnect() {
    setActionError(null);
    setIsDisconnecting(true);

    const result = await disconnectGoogleCalendarAction();

    setIsDisconnecting(false);

    if (result.error) {
      setActionError(result.error);
      return;
    }

    router.refresh();
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

    router.refresh();
  }

  if (!isConnected) {
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
            defaultValue={selectedCalendarId}
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
        <Button
          type="button"
          color="danger"
          background="secondary"
          loading={isDisconnecting}
          onClick={handleDisconnect}
        >
          Desconectar
        </Button>
      </div>
    </div>
  );
}

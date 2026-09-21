"use client";

import { useState } from "react";

import { Alert, Button, ConfirmIconButton, EmptyState, Input } from "@/components";
import {
  deleteConnectionAction,
  inviteConnectionAction,
  respondConnectionAction,
} from "@/features/connections/actions";
import { IConnection } from "@/features/connections/domain";

import styles from "./styles.module.css";

const STATUS_LABEL: Record<IConnection["status"], string> = {
  pending: "Pendente",
  accepted: "Conectado",
  declined: "Recusado",
};

export function PeoplePanel({ connections }: { connections: IConnection[] }) {
  const [visibleConnections, setVisibleConnections] = useState(connections);
  const [previousConnections, setPreviousConnections] = useState(connections);
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (connections !== previousConnections) {
    setPreviousConnections(connections);
    setVisibleConnections(connections);
  }

  async function handleInvite(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const result = await inviteConnectionAction({ email });

      if (result.error) {
        setError(result.error);
        return;
      }

      setEmail("");
      if (result.connection) {
        setVisibleConnections((current) => [result.connection!, ...current]);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRespond(id: string, accept: boolean) {
    setPendingId(id);
    setError(null);

    try {
      const result = await respondConnectionAction({ id, accept });
      if (result.error) {
        setError(result.error);
        return;
      }

      setVisibleConnections((current) => current.map((connection) =>
        connection.id === id
          ? { ...connection, status: accept ? "accepted" : "declined" }
          : connection
      ));
    } finally {
      setPendingId(null);
    }
  }

  async function handleRemove(id: string) {
    setPendingId(id);
    setError(null);

    try {
      const result = await deleteConnectionAction({ id });
      if (result.error) {
        setError(result.error);
        return;
      }

      setVisibleConnections((current) => current.filter((connection) => connection.id !== id));
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className={styles.panel}>
      <form className={styles.form} onSubmit={handleInvite}>
        <Input.Wrapper>
          <Input.Field
            type="email"
            required
            autoComplete="email"
            placeholder="E-mail da pessoa"
            aria-label="E-mail para convidar"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </Input.Wrapper>

        <Button.Root type="submit" className={styles.smallButton} loading={isSubmitting}>
          Convidar
        </Button.Root>
      </form>

      {error && <Alert variant="error">{error}</Alert>}

      {visibleConnections.length === 0 ? (
        <EmptyState tone="muted">
          Ninguém conectado ainda. Convide alguém pra compartilhar tarefas,
          rotina, hábitos ou objetivos.
        </EmptyState>
      ) : (
        <ul className={styles.list}>
          {visibleConnections.map((connection) => (
            <li key={connection.id} className={styles.item}>
              <div className={styles.itemInfo}>
                <span className={styles.email}>
                  {connection.otherPersonName || connection.otherPersonEmail}
                </span>
                <span className={styles.meta}>
                  {STATUS_LABEL[connection.status]}
                  {connection.status === "pending" &&
                    (connection.direction === "sent" ? " · convite enviado" : " · convite recebido")}
                </span>
              </div>

              <div className={styles.actions}>
                {connection.status === "pending" && connection.direction === "received" ? (
                  <>
                    <Button.Root
                      type="button"
                      className={styles.smallButton}
                      loading={pendingId === connection.id}
                      onClick={() => handleRespond(connection.id, true)}
                    >
                      Aceitar
                    </Button.Root>
                    <Button.Root
                      type="button"
                      variant="secondary"
                      className={styles.smallButton}
                      loading={pendingId === connection.id}
                      onClick={() => handleRespond(connection.id, false)}
                    >
                      Recusar
                    </Button.Root>
                  </>
                ) : (
                  <ConfirmIconButton
                    icon="FaTrash"
                    ariaLabel={`Remover conexão com ${connection.otherPersonEmail}`}
                    confirmText={`Remover a conexão com ${connection.otherPersonName || connection.otherPersonEmail}?`}
                    confirmLabel="Remover"
                    className={styles.smallButton}
                    loading={pendingId === connection.id}
                    onConfirm={() => handleRemove(connection.id)}
                  />
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button, Input } from "@/components";

import {
  deleteConnectionAction,
  inviteConnectionAction,
  respondConnectionAction,
} from "@/features/connections/actions";
import { IConnection } from "@/features/connections/domain";

import styles from "./people-panel.module.css";

const STATUS_LABEL: Record<IConnection["status"], string> = {
  pending: "Pendente",
  accepted: "Conectado",
  declined: "Recusado",
};

export function PeoplePanel({ connections }: { connections: IConnection[] }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      router.refresh();
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

      router.refresh();
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

      router.refresh();
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
            placeholder="e-mail da pessoa"
            aria-label="E-mail para convidar"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </Input.Wrapper>

        <Button type="submit" size="small" loading={isSubmitting}>
          Convidar
        </Button>
      </form>

      {error && <p className={styles.error}>{error}</p>}

      {connections.length === 0 ? (
        <p className={styles.empty}>
          Ninguém conectado ainda. Convide alguém pra compartilhar tarefas,
          rotina, hábitos ou metas.
        </p>
      ) : (
        <ul className={styles.list}>
          {connections.map((connection) => (
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
                    <Button
                      type="button"
                      size="small"
                      loading={pendingId === connection.id}
                      onClick={() => handleRespond(connection.id, true)}
                    >
                      Aceitar
                    </Button>
                    <Button
                      type="button"
                      size="small"
                      variant="secondary"
                      loading={pendingId === connection.id}
                      onClick={() => handleRespond(connection.id, false)}
                    >
                      Recusar
                    </Button>
                  </>
                ) : (
                  <Button
                    type="button"
                    size="small"
                    variant="ghost"
                    tone="danger"
                    aria-label={`Remover conexão com ${connection.otherPersonEmail}`}
                    loading={pendingId === connection.id}
                    onClick={() => handleRemove(connection.id)}
                  >
                    Remover
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

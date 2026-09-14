"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { Icon } from "@/components/icon";

import { Button, ConfirmIconButton } from "@/components";

import {
  deleteHealthCheckupAction,
  markHealthCheckupDoneAction,
} from "@/features/health/actions";
import { IHealthCheckup } from "@/features/health/domain";

import styles from "../health.module.css";

export function List({ checkups }: { checkups: IHealthCheckup[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function handleMarkDone(id: string) {
    setBusyId(id);

    try {
      await markHealthCheckupDoneAction({ id });
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(id: string) {
    setBusyId(id);

    try {
      await deleteHealthCheckupAction({ id });
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  if (checkups.length === 0) {
    return (
      <p className={styles.emptyMessage}>
        Nenhum cuidado preventivo cadastrado ainda.
      </p>
    );
  }

  return (
    <ul className={styles.list}>
      {checkups.map((checkup) => (
        <li
          key={checkup.id}
          className={`${styles.item} ${checkup.isOverdue ? styles.itemOverdue : ""}`}
        >
          <div className={styles.itemInfo}>
            <p className={styles.itemTitle}>{checkup.title}</p>
            <span className={styles.itemMeta}>
              {checkup.category}
              {checkup.lastDoneAt &&
                ` · Última vez: ${formatDate(checkup.lastDoneAt)}`}
              {checkup.nextDueDate && (
                <>
                  {" · "}
                  {checkup.isOverdue ? (
                    <span className={styles.overdueLabel}>
                      Estimativa: atrasado desde{" "}
                      {formatDate(checkup.nextDueDate)}
                    </span>
                  ) : (
                    `Estimativa: próximo em ${formatDate(checkup.nextDueDate)}`
                  )}
                </>
              )}
            </span>
          </div>

          <div className={styles.actions}>
            <Button.Root
              className={styles.markDoneButton}
              loading={busyId === checkup.id}
              aria-label={`Marcar ${checkup.title} como feito hoje`}
              onClick={() => handleMarkDone(checkup.id)}
            >
              <Icon name="FaCheck" />
            </Button.Root>

            <ConfirmIconButton
              icon="FaTrash"
              ariaLabel={`Excluir ${checkup.title}`}
              confirmText="Excluir este cuidado?"
              loading={busyId === checkup.id}
              onConfirm={() => handleDelete(checkup.id)}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

function formatDate(date: string): string {
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}`;
}

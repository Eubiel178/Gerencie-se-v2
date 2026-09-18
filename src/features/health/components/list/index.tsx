"use client";

import { useState } from "react";

import { Icon } from "@/components/icon";

import { Button, ConfirmIconButton, EmptyState } from "@/components";

import {
  deleteHealthCheckupAction,
  markHealthCheckupDoneAction,
} from "@/features/health/actions";
import { IHealthCheckup } from "@/features/health/domain";
import { computeCheckupDueState } from "@/features/health/domain";

import { EditCheckup } from "../edit-checkup";

import styles from "./styles.module.css";

interface CategoryGroup {
  label: string;
  checkups: IHealthCheckup[];
}

// Agrupa por categoria (texto livre no schema, sem enum) de forma
// case-insensitive - "Exame"/"exame" caem no mesmo grupo, mas o rótulo
// exibido usa a grafia da PRIMEIRA vez que a categoria apareceu. Dentro
// de cada grupo, atrasado vem primeiro, depois por data mais próxima de
// vencer - sem isso a lista inteira era plana e sem ordem nenhuma, a
// causa principal da confusão relatada.
function groupByCategory(checkups: IHealthCheckup[]): CategoryGroup[] {
  const groups = new Map<string, CategoryGroup>();

  for (const checkup of checkups) {
    const key = checkup.category.trim().toLowerCase();
    const existing = groups.get(key);

    if (existing) {
      existing.checkups.push(checkup);
    } else {
      groups.set(key, { label: checkup.category, checkups: [checkup] });
    }
  }

  for (const group of groups.values()) {
    group.checkups.sort((a, b) => {
      if (a.isOverdue !== b.isOverdue) return a.isOverdue ? -1 : 1;
      if (!a.nextDueDate) return 1;
      if (!b.nextDueDate) return -1;
      return a.nextDueDate.localeCompare(b.nextDueDate);
    });
  }

  return [...groups.values()].sort((a, b) => a.label.localeCompare(b.label, "pt-BR"));
}

export function List({ checkups }: { checkups: IHealthCheckup[] }) {
  const [visibleCheckups, setVisibleCheckups] = useState(checkups);
  const [previousCheckups, setPreviousCheckups] = useState(checkups);
  const [busyId, setBusyId] = useState<string | null>(null);

  if (checkups !== previousCheckups) {
    setPreviousCheckups(checkups);
    setVisibleCheckups(checkups);
  }

  async function handleMarkDone(id: string) {
    setBusyId(id);

    try {
      const result = await markHealthCheckupDoneAction({ id });
      if (!result.error && result.lastDoneAt) {
        setVisibleCheckups((current) => current.map((checkup) => {
          if (checkup.id !== id) return checkup;
          const dueState = computeCheckupDueState(result.lastDoneAt, checkup.intervalDays);
          return { ...checkup, lastDoneAt: result.lastDoneAt, ...dueState };
        }));
      }
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(id: string) {
    setBusyId(id);

    try {
      const result = await deleteHealthCheckupAction({ id });
      if (!result.error) setVisibleCheckups((current) => current.filter((checkup) => checkup.id !== id));
    } finally {
      setBusyId(null);
    }
  }

  if (visibleCheckups.length === 0) {
    return <EmptyState>Adicione um cuidado preventivo para acompanhar quando ele precisa da sua atenção.</EmptyState>;
  }

  const groups = groupByCategory(visibleCheckups);

  return (
    <div className={styles.groups}>
      {groups.map((group) => (
        <section key={group.label} className={styles.categoryGroup}>
          <h2 className={styles.categoryGroupTitle}>{group.label}</h2>

          <ul className={styles.list}>
            {group.checkups.map((checkup) => (
              <li
                key={checkup.id}
                className={`${styles.item} ${checkup.isOverdue ? styles.itemOverdue : ""}`}
              >
                <div className={styles.itemInfo}>
                  <p className={styles.itemTitle}>{checkup.title}</p>

                  <span className={styles.itemMeta}>
                    {checkup.lastDoneAt && `Última vez: ${formatDate(checkup.lastDoneAt)}`}
                    {checkup.lastDoneAt && checkup.nextDueDate && " · "}
                    {checkup.nextDueDate &&
                      (checkup.isOverdue
                        ? `Estimativa: atrasado desde ${formatDate(checkup.nextDueDate)}`
                        : `Estimativa: próximo em ${formatDate(checkup.nextDueDate)}`)}
                  </span>

                  {checkup.notes && <p className={styles.itemNotes}>{checkup.notes}</p>}

                  {checkup.isOverdue && (
                    <span className={styles.overdueBadge}>
                      <Icon name="FaExclamationTriangle" aria-hidden="true" />
                      Atrasado
                    </span>
                  )}
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

                  <EditCheckup checkup={checkup} />

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
        </section>
      ))}
    </div>
  );
}

function formatDate(date: string): string {
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}`;
}

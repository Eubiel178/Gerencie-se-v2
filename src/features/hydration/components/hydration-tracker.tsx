"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { Alert, Button, ConfirmIconButton, Input } from "@/components";

import {
  deleteHydrationLogAction,
  logWaterAction,
  updateHydrationGoalAction,
} from "@/features/hydration/actions";
import { IHydrationDay, IHydrationSummary, calculateHydrationGoalPercent } from "@/features/hydration/domain";

import { emitMascotEvent } from "@/features/mascot-pet";

import styles from "../hydration.module.css";

const QUICK_AMOUNTS = [200, 300, 500];

interface HydrationTrackerProps {
  today: IHydrationSummary;
  week: IHydrationDay[];
}

export function HydrationTracker({ today, week }: HydrationTrackerProps) {
  const router = useRouter();
  const [customAmount, setCustomAmount] = useState("");
  const [pendingLogControl, setPendingLogControl] = useState<string | null>(null);
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [isSavingGoal, setIsSavingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState(String(today.goalMl));
  const [actionError, setActionError] = useState<string | null>(null);
  const [deletingLogId, setDeletingLogId] = useState<string | null>(null);

  async function handleLog(amountMl: number, control: string) {
    if (amountMl <= 0) return;
    setPendingLogControl(control);
    setActionError(null);

    try {
      const result = await logWaterAction({ amountMl });
      if (result.error) {
        setActionError(result.error);
        emitMascotEvent("action-error");
        return;
      }

      emitMascotEvent("hydration-logged");
      router.refresh();
    } finally {
      setPendingLogControl(null);
    }
  }

  async function handleCustomSubmit(event: React.FormEvent) {
    event.preventDefault();
    const amountMl = Number(customAmount);

    if (!Number.isFinite(amountMl) || amountMl <= 0) {
      setActionError("Informe uma quantidade válida, maior que zero.");
      return;
    }

    await handleLog(amountMl, "custom");
    setCustomAmount("");
  }

  async function handleDelete(id: string) {
    if (deletingLogId) return;

    setActionError(null);
    setDeletingLogId(id);

    try {
      const result = await deleteHydrationLogAction({ id });
      if (result.error) {
        setActionError(result.error);
        return;
      }

      router.refresh();
    } finally {
      setDeletingLogId(null);
    }
  }

  async function handleSaveGoal(event: React.FormEvent) {
    event.preventDefault();
    if (isSavingGoal) return;

    const goalMl = Number(goalInput);

    if (!Number.isFinite(goalMl) || goalMl <= 0) {
      setActionError("Informe uma meta válida, maior que zero.");
      return;
    }

    setActionError(null);
    setIsSavingGoal(true);

    try {
      const result = await updateHydrationGoalAction(goalMl);
      if (result.error) {
        setActionError(result.error);
        return;
      }

      setIsEditingGoal(false);
      router.refresh();
    } finally {
      setIsSavingGoal(false);
    }
  }

  const percent = calculateHydrationGoalPercent(today);
  const maxWeekMl = Math.max(...week.map((day) => day.totalMl), today.goalMl);

  return (
    <div className={styles.panel}>
      <span className={styles.amount}>{today.totalMl} ml</span>

      {actionError && <Alert variant="error">{actionError}</Alert>}

      {isEditingGoal ? (
        <form className={styles.goalForm} onSubmit={handleSaveGoal}>
          <Input.Field
            type="number"
            min={1}
            aria-label="Meta diária de hidratação em mililitros"
            value={goalInput}
            onChange={(event) => setGoalInput(event.target.value)}
          />
          <Button.Root type="submit" className={styles.smallButton} loading={isSavingGoal}>
            Salvar
          </Button.Root>
          <Button.Root
            type="button"
            variant="secondary"
            className={styles.smallButton}
            disabled={isSavingGoal}
            onClick={() => setIsEditingGoal(false)}
          >
            Cancelar
          </Button.Root>
        </form>
      ) : (
        <button
          type="button"
          className={styles.goal}
          onClick={() => {
            setGoalInput(String(today.goalMl));
            setIsEditingGoal(true);
          }}
        >
          <span className={styles.goalLabel}>Meta diária</span>
          <strong>{today.goalMl} ml</strong>
          <span className={styles.goalAction}>Editar</span>
        </button>
      )}

      <div className={styles.progressTrack}>
        <div className={styles.progressFill} style={{ width: `${percent}%` }} />
      </div>

      <div className={styles.quickAdd}>
        {QUICK_AMOUNTS.map((amount) => (
          <Button.Root
            key={amount}
            variant="secondary"
            disabled={pendingLogControl !== null}
            loading={pendingLogControl === `quick-${amount}`}
            onClick={() => handleLog(amount, `quick-${amount}`)}
          >
            +{amount} ml
          </Button.Root>
        ))}
      </div>

      <form className={styles.customForm} onSubmit={handleCustomSubmit}>
        <Input.Field
          type="number"
          min={1}
          placeholder="ml"
          aria-label="Quantidade em mililitros"
          value={customAmount}
          onChange={(event) => setCustomAmount(event.target.value)}
        />
        <Button.Root type="submit" variant="secondary" disabled={pendingLogControl !== null} loading={pendingLogControl === "custom"}>
          Adicionar
        </Button.Root>
      </form>

      {today.logs.length > 0 && (
        <ul className={styles.logs}>
          {today.logs.map((log) => (
            <li key={log.id} className={styles.logItem}>
              <span>
                {log.amountMl} ml às{" "}
                {new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(
                  log.loggedAt
                )}
              </span>
              <ConfirmIconButton
                icon="FaTrash"
                ariaLabel="Remover registro"
                confirmText={`Remover o registro de ${log.amountMl} ml?`}
                className={styles.smallButton}
                loading={deletingLogId === log.id}
                onConfirm={() => handleDelete(log.id)}
              />
            </li>
          ))}
        </ul>
      )}

      <div className={styles.weekSection}>
        <h2 className={styles.sectionTitle}>Últimos 7 dias</h2>

        {week.every((day) => day.totalMl === 0) ? (
          <p className={styles.weekEmptyMessage}>Sem registros ainda nos últimos 7 dias.</p>
        ) : (
          <div className={styles.week}>
            {week.map((day) => (
              <div key={day.date} className={styles.weekBar}>
                <div
                  className={styles.weekBarFill}
                  style={{ height: `${Math.max(2, (day.totalMl / maxWeekMl) * 100)}%` }}
                />
                <span className={styles.weekBarLabel}>{formatWeekday(day.date)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function formatWeekday(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", { weekday: "narrow" }).format(
    new Date(year, month - 1, day)
  );
}

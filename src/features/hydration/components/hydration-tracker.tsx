"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { FaTrash } from "react-icons/fa";

import { Button, Input, Feedback } from "@/components";

import {
  deleteHydrationLogAction,
  logWaterAction,
  updateHydrationGoalAction,
} from "@/features/hydration/actions";
import { IHydrationDay, IHydrationSummary } from "@/features/hydration/domain";

import styles from "../hydration.module.css";

const QUICK_AMOUNTS = [200, 300, 500];

interface HydrationTrackerProps {
  today: IHydrationSummary;
  week: IHydrationDay[];
}

export function HydrationTracker({ today, week }: HydrationTrackerProps) {
  const router = useRouter();
  const [customAmount, setCustomAmount] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState(String(today.goalMl));
  const [actionError, setActionError] = useState<string | null>(null);

  async function handleLog(amountMl: number) {
    if (amountMl <= 0) return;
    setIsBusy(true);
    setActionError(null);

    try {
      const result = await logWaterAction({ amountMl });
      if (result.error) {
        setActionError(result.error);
        return;
      }

      router.refresh();
    } finally {
      setIsBusy(false);
    }
  }

  async function handleCustomSubmit(event: React.FormEvent) {
    event.preventDefault();
    const amountMl = Number(customAmount);
    if (!Number.isFinite(amountMl) || amountMl <= 0) return;

    await handleLog(amountMl);
    setCustomAmount("");
  }

  async function handleDelete(id: string) {
    setActionError(null);

    const result = await deleteHydrationLogAction({ id });
    if (result.error) {
      setActionError(result.error);
      return;
    }

    router.refresh();
  }

  async function handleSaveGoal(event: React.FormEvent) {
    event.preventDefault();
    const goalMl = Number(goalInput);
    if (!Number.isFinite(goalMl) || goalMl <= 0) return;

    setActionError(null);
    const result = await updateHydrationGoalAction(goalMl);
    if (result.error) {
      setActionError(result.error);
      return;
    }

    setIsEditingGoal(false);
    router.refresh();
  }

  const percent = Math.min(100, Math.round((today.totalMl / today.goalMl) * 100));
  const maxWeekMl = Math.max(...week.map((day) => day.totalMl), today.goalMl);

  return (
    <div className={styles.panel}>
      <span className={styles.amount}>{today.totalMl} ml</span>

      {actionError && <Feedback type="error">{actionError}</Feedback>}

      {isEditingGoal ? (
        <form className={styles.goalForm} onSubmit={handleSaveGoal}>
          <Input.Field
            type="number"
            min={1}
            aria-label="Meta diária de hidratação em mililitros"
            value={goalInput}
            onChange={(event) => setGoalInput(event.target.value)}
          />
          <Button type="submit" size="small">Salvar</Button>
          <Button type="button" background="secondary" size="small" onClick={() => setIsEditingGoal(false)}>
            Cancelar
          </Button>
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
          Meta: {today.goalMl} ml (editar)
        </button>
      )}

      <div className={styles.progressTrack}>
        <div className={styles.progressFill} style={{ width: `${percent}%` }} />
      </div>

      <div className={styles.quickAdd}>
        {QUICK_AMOUNTS.map((amount) => (
          <Button key={amount} background="secondary" loading={isBusy} onClick={() => handleLog(amount)}>
            +{amount} ml
          </Button>
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
        <Button type="submit" background="secondary" loading={isBusy}>
          Adicionar
        </Button>
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
              <Button
                color="danger"
                background="transparent"
                size="small"
                aria-label="Remover registro"
                onClick={() => handleDelete(log.id)}
              >
                <FaTrash />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <div className={styles.weekSection}>
        <h2 className={styles.sectionTitle}>Últimos 7 dias</h2>

        {week.every((day) => day.totalMl === 0) ? (
          <Feedback>Sem registros ainda nos últimos 7 dias.</Feedback>
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

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Card } from "@/features/dashboard/components/shared";

import { toggleHabitLogAction } from "@/features/habits/actions";
import { IHabit } from "@/features/habits/domain";

import styles from "./habits-today.module.css";

interface HabitsTodayProps {
  habits: IHabit[];
  today: string;
}

export function HabitsToday({ habits, today }: HabitsTodayProps) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const active = habits.filter((habit) => !habit.archived);

  async function handleToggle(habitId: string) {
    setPendingId(habitId);

    try {
      await toggleHabitLogAction({ habitId, date: today });
      router.refresh();
    } finally {
      setPendingId(null);
    }
  }

  return (
    <Card title="Hábitos de hoje" href="/home/habits" linkLabel="Ver todos">
      {active.length === 0 ? (
        <p className={styles.empty}>Nenhum hábito cadastrado ainda.</p>
      ) : (
        <ul className={styles.list}>
          {active.map((habit) => (
            <li key={habit.id} className={styles.item}>
              <button
                type="button"
                className={styles.checkbox}
                data-checked={habit.completedToday}
                aria-pressed={habit.completedToday}
                aria-label={`Marcar ${habit.title} como ${habit.completedToday ? "não concluído" : "concluído"} hoje`}
                disabled={pendingId === habit.id}
                onClick={() => handleToggle(habit.id)}
              >
                {habit.completedToday ? "✓" : ""}
              </button>

              <span className={styles.title} data-checked={habit.completedToday}>
                {habit.title}
              </span>

              {habit.frequency === "daily" && habit.currentStreak > 0 && (
                <span className={styles.streak}>🔥{habit.currentStreak}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

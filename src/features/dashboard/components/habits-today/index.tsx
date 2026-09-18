"use client";

import { useState } from "react";

import { EmptyState } from "@/components";
import { Card } from "@/features/dashboard/components/shared";

import { toggleHabitLogAction } from "@/features/habits/actions";
import { IHabit } from "@/features/habits/domain";

import styles from "./styles.module.css";

interface HabitsTodayProps {
  habits: IHabit[];
  today: string;
}

export function HabitsToday({ habits, today }: HabitsTodayProps) {
  const [visibleHabits, setVisibleHabits] = useState(habits);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const active = visibleHabits.filter((habit) => !habit.archived);

  async function handleToggle(habitId: string) {
    setPendingId(habitId);

    try {
      const result = await toggleHabitLogAction({ habitId, date: today });
      if (!result.error) {
        setVisibleHabits((current) => current.map((habit) => {
          if (habit.id !== habitId) return habit;
          const completedToday = !!result.completed;
          return {
            ...habit,
            completedToday,
            completionsThisWeek: Math.max(0, habit.completionsThisWeek + (completedToday ? 1 : -1)),
            currentStreak: completedToday ? habit.currentStreak + 1 : Math.max(0, habit.currentStreak - 1),
          };
        }));
      }
    } finally {
      setPendingId(null);
    }
  }

  return (
    <Card title="Hábitos de hoje" href="/home/habits" linkLabel="Ver todos">
      {active.length === 0 ? (
        <EmptyState tone="muted">Adicione um hábito para acompanhar sua consistência aqui.</EmptyState>
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

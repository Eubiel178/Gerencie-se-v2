"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { FaFire, FaTrash, FaCheck } from "react-icons/fa";

import { Button, Feedback } from "@/components";

import { deleteHabitAction, toggleHabitLogAction } from "@/features/habits/actions";
import { EditHabit } from "../../modal";

import { IHabit } from "@/features/habits/domain";
import { LoadAcceptedConnections } from "@/features/connections/domain";

import styles from "../../../habits.module.css";

interface CardProps {
  habit: IHabit;
  today: string;
  connections: LoadAcceptedConnections.Model;
}

export function Card({ habit, today, connections }: CardProps) {
  const router = useRouter();
  const [isRemoving, setIsRemoving] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  async function handleRemove() {
    setIsRemoving(true);

    try {
      await deleteHabitAction({ id: habit.id });
      router.refresh();
    } finally {
      setIsRemoving(false);
    }
  }

  async function handleToggleToday() {
    setIsToggling(true);

    try {
      await toggleHabitLogAction({ habitId: habit.id, date: today });
      router.refresh();
    } finally {
      setIsToggling(false);
    }
  }

  const target = habit.targetPerWeek ?? 7;
  const progressPercent = Math.min(100, Math.round((habit.completionsThisWeek / target) * 100));

  return (
    <li className={styles.card}>
      <div className={styles.cardHeader}>
        <h3 className={styles.cardTitle}>{habit.title}</h3>

        <div className={styles.actions}>
          <EditHabit habitBeingEdited={habit} connections={connections} />

          {!habit.isSharedWithMe && (
            <Button
              color="danger"
              background="transparent"
              size="xlarge"
              aria-label={`Excluir hábito ${habit.title}`}
              loading={isRemoving}
              onClick={handleRemove}
            >
              <FaTrash />
            </Button>
          )}
        </div>
      </div>

      {habit.isSharedWithMe ? (
        <Feedback type="info" size="xSmall">Compartilhado por {habit.ownerLabel}</Feedback>
      ) : (
        habit.sharedWithUserId && <Feedback type="info" size="xSmall">Compartilhado</Feedback>
      )}

      <div className={styles.stats}>
        <span className={styles.streak}>
          <FaFire aria-hidden="true" />
          {habit.currentStreak > 0
            ? `${habit.currentStreak} dia${habit.currentStreak > 1 ? "s" : ""} seguido${habit.currentStreak > 1 ? "s" : ""}`
            : "Sem sequência ainda"}
        </span>

        {habit.frequency === "weekly" && (
          <>
            <span className={styles.weekProgress}>
              {habit.completionsThisWeek}/{target} esta semana
            </span>
            <div className={styles.progressTrack}>
              <div className={styles.progressFill} style={{ width: `${progressPercent}%` }} />
            </div>
          </>
        )}
      </div>

      <Button
        className={styles.toggleButton}
        background={habit.completedToday ? "secondary" : "primary"}
        loading={isToggling}
        onClick={handleToggleToday}
      >
        {habit.completedToday ? (
          <>
            <FaCheck aria-hidden="true" /> Feito hoje
          </>
        ) : (
          "Marcar hoje"
        )}
      </Button>
    </li>
  );
}

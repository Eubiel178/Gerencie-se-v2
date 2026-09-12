"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { Icon } from "@/components/icon";

import { Button } from "@/components";
import { SharedBadge } from "@/features/connections/components/shared-badge";

import {
  deleteHabitAction,
  toggleHabitLogAction,
} from "@/features/habits/actions";
import { EditHabit } from "../../modal";

import { IHabit } from "@/features/habits/domain";
import { LoadAcceptedConnections } from "@/features/connections/domain";
import { GoalOption } from "../../modal/interfaces";

import { emitMascotEvent } from "@/features/mascot-pet";

import styles from "../../../habits.module.css";

interface CardProps {
  habit: IHabit;
  today: string;
  connections: LoadAcceptedConnections.Model;
  goalOptions: GoalOption[];
  linkedGoalTitle?: string;
}

export function Card({
  habit,
  today,
  connections,
  goalOptions,
  linkedGoalTitle,
}: CardProps) {
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
      const result = await toggleHabitLogAction({ habitId: habit.id, date: today });
      if (result.error) {
        emitMascotEvent("action-error");
      } else if (result.completed) {
        emitMascotEvent("habit-completed");
      }
      router.refresh();
    } finally {
      setIsToggling(false);
    }
  }

  const target = habit.targetPerWeek ?? 7;
  const progressPercent = Math.min(
    100,
    Math.round((habit.completionsThisWeek / target) * 100),
  );

  return (
    <li className={styles.card}>
      <div className={styles.cardHeader}>
        <h3 className={styles.cardTitle}>{habit.title}</h3>

        <div className={styles.actions}>
          <EditHabit
            habitBeingEdited={habit}
            connections={connections}
            goalOptions={goalOptions}
          />

          {!habit.isSharedWithMe && (
            <Button.Preset
              icon={{ name: "FaTrash" }}
              root={{
                tone: "danger",
                "aria-label": `Excluir hábito ${habit.title}`,
                loading: isRemoving,
                onClick: handleRemove,
              }}
            />
          )}
        </div>
      </div>

      <SharedBadge
        isSharedWithMe={habit.isSharedWithMe}
        ownerLabel={habit.ownerLabel}
        isShared={!!habit.sharedWithUserId}
        className={styles.sharedBadge}
      />

      {linkedGoalTitle && (
        <p className={styles.linkedGoal}>Vinculado a: {linkedGoalTitle}</p>
      )}

      <div className={styles.stats}>
        <span className={styles.streak}>
          <Icon name="FaFire" aria-hidden="true" />
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
              <div
                className={styles.progressFill}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </>
        )}
      </div>

      <Button.Root
        className={styles.toggleButton}
        variant={habit.completedToday ? "secondary" : "primary"}
        loading={isToggling}
        onClick={handleToggleToday}
      >
        {habit.completedToday ? (
          <>
            <Icon name="FaCheck" aria-hidden="true" /> Feito hoje
          </>
        ) : (
          "Marcar hoje"
        )}
      </Button.Root>
    </li>
  );
}

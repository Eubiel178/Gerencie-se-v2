"use client";

import { useState } from "react";

import { Button, ConfirmIconButton } from "@/components";
import { Icon } from "@/components/icon";
import { SharedBadge } from "@/features/connections/components/shared-badge";
import { LoadAcceptedConnections } from "@/features/connections/domain";
import {
  deleteHabitAction,
  toggleHabitLogAction,
} from "@/features/habits/actions";
import { IHabit } from "@/features/habits/domain";
import { emitMascotEvent } from "@/features/mascot-pet";

import { EditHabit } from "../../modal";
import { GoalOption } from "../../modal/interfaces";


import styles from "./styles.module.css";

interface CardProps {
  habit: IHabit;
  today: string;
  connections: LoadAcceptedConnections.Model;
  goalOptions: GoalOption[];
  linkedGoalTitle?: string;
  onRemove: (id: string) => void;
  onToggle: (id: string, completed: boolean) => void;
}

export function Card({
  habit,
  today,
  connections,
  goalOptions,
  linkedGoalTitle,
  onRemove,
  onToggle,
}: CardProps) {
  const [isRemoving, setIsRemoving] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  async function handleRemove() {
    setIsRemoving(true);

    try {
      const result = await deleteHabitAction({ id: habit.id });
      if (result.error) {
        emitMascotEvent("action-error");
      } else {
        onRemove(habit.id);
      }
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
      if (!result.error) onToggle(habit.id, !!result.completed);
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
            <ConfirmIconButton
              icon="FaTrash"
              ariaLabel={`Excluir hábito "${habit.title}"`}
              confirmText={`Excluir "${habit.title}"?`}
              loading={isRemoving}
              onConfirm={handleRemove}
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

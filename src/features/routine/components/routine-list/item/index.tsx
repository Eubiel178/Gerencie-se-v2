"use client";

import { useState } from "react";

import dayjs from "dayjs";

import { Button, ConfirmIconButton } from "@/components";
import { SharedBadge } from "@/features/connections/components/shared-badge";
import { LoadAcceptedConnections } from "@/features/connections/domain";
import { emitMascotEvent } from "@/features/mascot-pet";
import { deleteRoutineItemAction, toggleRoutineItemLogAction } from "@/features/routine/actions";
import { IRoutineItem } from "@/features/routine/domain";

import { EditRoutineItem } from "../../modal";
import { TaskOption } from "../../modal/interfaces";


import styles from "./styles.module.css";

interface RoutineListItemProps {
  item: IRoutineItem;
  taskOptions: TaskOption[];
  connections: LoadAcceptedConnections.Model;
  linkedTaskTitle?: string;
  onToggle: (id: string, completedToday: boolean) => void;
  onRemove: (id: string) => void;
}

export function RoutineListItem({ item, taskOptions, connections, linkedTaskTitle, onToggle, onRemove }: RoutineListItemProps) {
  const [isRemoving, setIsRemoving] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  async function handleRemove() {
    setIsRemoving(true);

    try {
      const result = await deleteRoutineItemAction({ id: item.id });
      if (result.error) {
        emitMascotEvent("action-error");
      } else {
        onRemove(item.id);
      }
    } finally {
      setIsRemoving(false);
    }
  }

  async function handleToggleToday() {
    setIsToggling(true);

    try {
      const today = dayjs().format("YYYY-MM-DD");
      const result = await toggleRoutineItemLogAction({ routineItemId: item.id, date: today });

      if (result.error) {
        emitMascotEvent("action-error");
      } else if (result.completed) {
        emitMascotEvent("routine-completed");
      }

      if (!result.error) onToggle(item.id, !!result.completed);
    } finally {
      setIsToggling(false);
    }
  }

  return (
    <li className={styles.item}>
      <input
        type="checkbox"
        className={styles.doneCheckbox}
        checked={item.completedToday}
        disabled={isToggling}
        onChange={handleToggleToday}
        aria-label={`Marcar "${item.title}" como feito hoje`}
      />

      <span className={styles.time}>{item.time}</span>

      <div className={styles.content}>
        <p className={`${styles.itemTitle} ${item.completedToday ? styles.itemTitleDone : ""}`}>
          {item.title}
        </p>
        {linkedTaskTitle && (
          <p className={styles.linkedTask}>Vinculado a: {linkedTaskTitle}</p>
        )}
        <SharedBadge
          isSharedWithMe={item.isSharedWithMe}
          ownerLabel={item.ownerLabel}
          isShared={!!item.sharedWithUserId}
          className={styles.sharedBadge}
        />
      </div>

      <div className={styles.actions}>
        <EditRoutineItem itemBeingEdited={item} taskOptions={taskOptions} connections={connections} />

        {!item.isSharedWithMe && (
          <ConfirmIconButton
            icon="FaTrash"
            ariaLabel={`Remover "${item.title}" da rotina`}
            confirmText={`Remover "${item.title}" da rotina?`}
            confirmLabel="Remover"
            loading={isRemoving}
            onConfirm={handleRemove}
          />
        )}
      </div>
    </li>
  );
}

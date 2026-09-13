"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import dayjs from "dayjs";

import { Button } from "@/components";
import { SharedBadge } from "@/features/connections/components/shared-badge";

import { deleteRoutineItemAction, toggleRoutineItemLogAction } from "@/features/routine/actions";
import { EditRoutineItem } from "../../modal";

import { IRoutineItem } from "@/features/routine/domain";
import { LoadAcceptedConnections } from "@/features/connections/domain";
import { TaskOption } from "../../modal/interfaces";

import { emitMascotEvent } from "@/features/mascot-pet";

import styles from "../../../routine.module.css";

interface RoutineListItemProps {
  item: IRoutineItem;
  taskOptions: TaskOption[];
  connections: LoadAcceptedConnections.Model;
  linkedTaskTitle?: string;
}

export function RoutineListItem({ item, taskOptions, connections, linkedTaskTitle }: RoutineListItemProps) {
  const router = useRouter();
  const [isRemoving, setIsRemoving] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  async function handleRemove() {
    setIsRemoving(true);

    try {
      await deleteRoutineItemAction({ id: item.id });
      router.refresh();
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

      router.refresh();
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
          <Button.Preset
            icon={{ name: "FaTrash" }}
            root={{
              tone: "danger",
              "aria-label": `Remover ${item.title} da rotina`,
              loading: isRemoving,
              onClick: handleRemove,
            }}
          />
        )}
      </div>
    </li>
  );
}

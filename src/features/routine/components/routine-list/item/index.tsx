"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { FaTrash } from "@/components/icons";
import { Button } from "@/components";
import { SharedBadge } from "@/features/connections/components/shared-badge";

import { deleteRoutineItemAction } from "@/features/routine/actions";
import { EditRoutineItem } from "../../modal";

import { IRoutineItem } from "@/features/routine/domain";
import { LoadAcceptedConnections } from "@/features/connections/domain";
import { TaskOption } from "../../modal/interfaces";

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

  async function handleRemove() {
    setIsRemoving(true);

    try {
      await deleteRoutineItemAction({ id: item.id });
      router.refresh();
    } finally {
      setIsRemoving(false);
    }
  }

  return (
    <li className={styles.item}>
      <span className={styles.time}>{item.time}</span>

      <div className={styles.content}>
        <p className={styles.itemTitle}>{item.title}</p>
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
          <Button.IconButtonPreset
            icon={FaTrash}
            tone="danger"
            aria-label={`Remover ${item.title} da rotina`}
            loading={isRemoving}
            onClick={handleRemove}
          />
        )}
      </div>
    </li>
  );
}

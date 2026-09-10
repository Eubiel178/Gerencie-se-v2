"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { FaTrash } from "react-icons/fa";

import { Button } from "@/components";

import { deleteRoutineItemAction } from "@/features/routine/actions";
import { EditRoutineItem } from "../../modal";

import { IRoutineItem } from "@/features/routine/domain";
import { TaskOption } from "../../modal/interfaces";

import styles from "../../../routine.module.css";

interface RoutineListItemProps {
  item: IRoutineItem;
  taskOptions: TaskOption[];
  linkedTaskTitle?: string;
}

export function RoutineListItem({ item, taskOptions, linkedTaskTitle }: RoutineListItemProps) {
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
      </div>

      <div className={styles.actions}>
        <EditRoutineItem itemBeingEdited={item} taskOptions={taskOptions} />

        <Button
          color="danger"
          background="transparent"
          size="xlarge"
          aria-label={`Remover ${item.title} da rotina`}
          loading={isRemoving}
          onClick={handleRemove}
        >
          <FaTrash />
        </Button>
      </div>
    </li>
  );
}

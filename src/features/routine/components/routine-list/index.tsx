"use client";

import { useState } from "react";

import { EmptyState } from "@/components";
import { LoadAcceptedConnections } from "@/features/connections/domain";
import { IRoutineItem } from "@/features/routine/domain";

import { TaskOption } from "../modal/interfaces";

import { RoutineListItem } from "./item";
import styles from "./styles.module.css";

interface RoutineListProps {
  items: IRoutineItem[];
  taskOptions: TaskOption[];
  connections: LoadAcceptedConnections.Model;
}

export function RoutineList({ items, taskOptions, connections }: RoutineListProps) {
  const [visibleItems, setVisibleItems] = useState(items);
  const [previousItems, setPreviousItems] = useState(items);

  if (items !== previousItems) {
    setPreviousItems(items);
    setVisibleItems(items);
  }

  if (visibleItems.length === 0) {
    return (
      <EmptyState variant="box">Sua rotina ainda está vazia. Adicione o primeiro horário do seu dia.</EmptyState>
    );
  }

  const taskTitleById = new Map(taskOptions.map((task) => [task.id, task.title]));

  return (
    <ul className={styles.list}>
      {visibleItems.map((item) => (
        <RoutineListItem
          key={item.id}
          item={item}
          taskOptions={taskOptions}
          connections={connections}
          linkedTaskTitle={item.taskId ? taskTitleById.get(item.taskId) : undefined}
          onToggle={(id, completedToday) => {
            setVisibleItems((current) => current.map((currentItem) => currentItem.id === id ? { ...currentItem, completedToday } : currentItem));
          }}
          onRemove={(id) => setVisibleItems((current) => current.filter((item) => item.id !== id))}
        />
      ))}
    </ul>
  );
}

"use client";

import { useState } from "react";

import { EmptyState } from "@/components";
import { LoadAcceptedConnections } from "@/features/connections/domain";
import { IRoutineItem } from "@/features/routine/domain";

import { TaskOption } from "../modal/interfaces";

import { ROUTINE_PERIOD_LABELS, groupRoutineItemsByPeriod } from "./derive-routine-period";
import { findNextRoutineItemId } from "./find-next-routine-item";
import { RoutineListItem } from "./item";
import styles from "./styles.module.css";

interface RoutineListProps {
  items: IRoutineItem[];
  taskOptions: TaskOption[];
  connections: LoadAcceptedConnections.Model;
}

function nowAsHHMM(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
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
      <EmptyState variant="box">
        Sua rotina ainda está vazia. Adicione o primeiro horário fixo do seu dia — um alarme, uma refeição, o
        início do trabalho.
      </EmptyState>
    );
  }

  const taskTitleById = new Map(taskOptions.map((task) => [task.id, task.title]));
  // Calculado uma vez por render (não reativo a cada minuto) - é só uma
  // pista visual sutil de "o que vem a seguir", não um cronômetro que
  // precisa ficar exato ao segundo.
  const nextItemId = findNextRoutineItemId(visibleItems, nowAsHHMM());
  const groups = groupRoutineItemsByPeriod(visibleItems);

  return (
    <div className={styles.groups}>
      {groups.map((group) => (
        <div key={group.period ?? "single"} className={styles.group}>
          {group.period && (
            <p className={styles.periodLabel}>{ROUTINE_PERIOD_LABELS[group.period]}</p>
          )}
          <ul className={styles.list}>
            {group.items.map((item) => (
              <RoutineListItem
                key={item.id}
                item={item}
                taskOptions={taskOptions}
                connections={connections}
                linkedTaskTitle={item.taskId ? taskTitleById.get(item.taskId) : undefined}
                isNext={item.id === nextItemId}
                onToggle={(id, completedToday) => {
                  setVisibleItems((current) =>
                    current.map((currentItem) =>
                      currentItem.id === id ? { ...currentItem, completedToday } : currentItem
                    )
                  );
                }}
                onRemove={(id) => setVisibleItems((current) => current.filter((item) => item.id !== id))}
              />
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

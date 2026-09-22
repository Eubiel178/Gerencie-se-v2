"use client";

import { useState } from "react";

import dayjs from "dayjs";

import { ConfirmIconButton } from "@/components";
import { Icon } from "@/components/icon";
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
  /** É o próximo item ainda não feito hoje, na ordem do dia - ver
   * `findNextRoutineItemId`. Puramente visual (destaque sutil), nunca
   * afeta a lógica de conclusão. */
  isNext: boolean;
  onToggle: (id: string, completedToday: boolean) => void;
  onRemove: (id: string) => void;
}

export function RoutineListItem({
  item,
  taskOptions,
  connections,
  linkedTaskTitle,
  isNext,
  onToggle,
  onRemove,
}: RoutineListItemProps) {
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
    <li className={styles.item} data-next={isNext && !item.completedToday}>
      {/* Checkbox de "feito hoje" - mesmo visual de "quadradinho com
          check" de Tarefas/Objetivos (`.completeCheckbox`), mas SEM
          confirmação: aqui é uma ocorrência do dia, uma ação frequente e
          reversível com um novo clique, não uma conclusão única (mesmo
          raciocínio documentado em `ConfirmCheckbox` pra Hábitos). */}
      <button
        type="button"
        className={styles.doneCheckbox}
        data-checked={item.completedToday}
        aria-pressed={item.completedToday}
        disabled={isToggling}
        onClick={handleToggleToday}
        aria-label={`Marcar "${item.title}" como ${item.completedToday ? "não feito" : "feito"} hoje`}
      >
        {item.completedToday && <Icon name="FaCheck" aria-hidden="true" size={10} />}
      </button>

      <div className={styles.content}>
        {/* Meta acima do título (horário + destaque "a seguir" + tarefa
            vinculada) - mesma gramática de Tarefas/Objetivos: o horário
            vira contexto compacto, não compete em tamanho com o nome da
            atividade. */}
        <div className={styles.meta}>
          <span className={styles.time}>{item.time}</span>
          {isNext && !item.completedToday && (
            <span className={styles.metaGroup}>
              <span className={styles.metaSep} aria-hidden="true">
                ·
              </span>
              <span className={styles.nextTag}>A seguir</span>
            </span>
          )}
          {linkedTaskTitle && (
            <span className={styles.metaGroup}>
              <span className={styles.metaSep} aria-hidden="true">
                ·
              </span>
              <span className={styles.linkedTask}>{linkedTaskTitle}</span>
            </span>
          )}
        </div>

        <p className={styles.itemTitle} data-completed={item.completedToday}>
          {item.title}
        </p>

        <SharedBadge
          isSharedWithMe={item.isSharedWithMe}
          ownerLabel={item.ownerLabel}
          isShared={!!item.sharedWithUserId}
          className={styles.sharedBadge}
        />
      </div>

      <div className={styles.actions}>
        <details className={styles.overflowMenu}>
          <summary aria-label={`Mais ações para "${item.title}"`}>
            <Icon name="FaEllipsisV" aria-hidden="true" />
          </summary>
          <div className={styles.overflowMenuContent}>
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
        </details>
      </div>
    </li>
  );
}

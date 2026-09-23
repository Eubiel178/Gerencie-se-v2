"use client";

import { useState } from "react";

import { ConfirmCheckbox, ConfirmIconButton } from "@/components";
import { Icon } from "@/components/icon";
import { StatusBadge } from "@/components/status-badge";
import { SharedBadge } from "@/features/connections/components/shared-badge";
import { LoadAcceptedConnections } from "@/features/connections/domain";
import { IGoal } from "@/features/goals/domain";
import { formatTemporalContext } from "@/utils/date";

import { EditGoal } from "../../modal";
import { PRIORITY_LABELS } from "../../modal/interfaces";

import { formatGoalDeadline, isGoalOverdue } from "./deadline-helpers";
import styles from "./styles.module.css";
import { useGoalMutations } from "./use-goal-card-actions";

interface CardProps {
  goal: IGoal;
  connections: LoadAcceptedConnections.Model;
}

export function Card({ goal, connections }: CardProps) {
  const {
    isRemoving,
    isTogglingCompletion,
    busyStepId,
    isCompleted,
    handleRemoveGoal,
    handleToggleManualCompletion,
    handleToggleStep,
  } = useGoalMutations(goal);

  const completedSteps = goal.steps.filter((s) => s.completed).length;
  const totalSteps = goal.steps.length;
  const [showSteps, setShowSteps] = useState(false);

  return (
    <li className={styles.card} data-priority={goal.priority}>
      {/* Header: checkbox + menu — mesma gramática visual do TaskCard */}
      <div className={styles.cardHeader}>
        <ConfirmCheckbox
          className={styles.completeCheckbox}
          checked={isCompleted}
          ariaLabel={`Marcar objetivo "${goal.title}" como ${isCompleted ? "não concluído" : "concluído"}`}
          confirmText={
            isCompleted
              ? `Marcar o objetivo "${goal.title}" como não concluído?`
              : `Concluir o objetivo "${goal.title}"?`
          }
          confirmLabel={isCompleted ? "Reabrir" : "Concluir"}
          loading={isTogglingCompletion}
          onConfirm={handleToggleManualCompletion}
        />

        <div className={styles.actions}>
          <details className={styles.overflowMenu}>
            <summary aria-label={`Mais ações para ${goal.title}`}>
              <Icon name="FaEllipsisV" aria-hidden="true" />
            </summary>
            <div className={styles.overflowMenuContent}>
              <EditGoal goalBeingEdited={goal} connections={connections} />
              {!goal.isSharedWithMe && (
                <ConfirmIconButton
                  icon="FaTrash"
                  ariaLabel={`Excluir objetivo "${goal.title}"`}
                  confirmText={`Excluir "${goal.title}"?`}
                  loading={isRemoving}
                  onConfirm={handleRemoveGoal}
                />
              )}
            </div>
          </details>
        </div>
      </div>

      {/* Metadados — acima do título, mesmo padrão do TaskCard */}
      <div className={styles.meta}>
        <span className={styles.priorityText}>{PRIORITY_LABELS[goal.priority]}</span>

        {goal.deadline && (
          <span className={styles.metaGroup}>
            <span className={styles.metaSep} aria-hidden="true">
              ·
            </span>
            <span
              className={styles.deadline}
              data-overdue={isGoalOverdue(goal.deadline) && !isCompleted}
            >
              {formatGoalDeadline(goal.deadline)}
            </span>
          </span>
        )}
      </div>

      {/* Título — abaixo dos metadados */}
      <h3 className={styles.cardTitle} data-completed={isCompleted}>
        {goal.title}
      </h3>

      <div className={styles.cardBody}>
        {isCompleted && (
          <div className={styles.statusRow}>
            <StatusBadge tone="completed">
              <Icon name="FaCheck" aria-hidden="true" size={10} /> Concluído
              {formatTemporalContext(goal.completedAt) && (
                <> · {formatTemporalContext(goal.completedAt)}</>
              )}
            </StatusBadge>
          </div>
        )}

        {goal.description && <p className={styles.description}>{goal.description}</p>}

        {/* Progresso — compacto e recolhível, só quando existem etapas
            (um objetivo sem etapas é binário: pendente/concluído, uma
            barra de 0% ali não comunica nada, só ocupa espaço). */}
        {totalSteps > 0 && (
          <div className={styles.stepsCompact}>
            <div className={styles.stepsCompactSummary}>
              <span>
                {completedSteps} de {totalSteps} passos
              </span>
              <button
                type="button"
                onClick={() => setShowSteps((prev) => !prev)}
                aria-expanded={showSteps}
              >
                {showSteps ? "Ocultar passos" : "Ver passos"}
              </button>
            </div>
            <div
              className={styles.stepsBar}
              role="progressbar"
              aria-valuenow={completedSteps}
              aria-valuemin={0}
              aria-valuemax={totalSteps}
              aria-label={`${completedSteps} de ${totalSteps} passos concluídos`}
            >
              <div className={styles.stepsBarFill} style={{ width: `${goal.progressPercent}%` }} />
            </div>

            {showSteps && (
              <ul className={styles.stepsExpanded} aria-label="Passos do objetivo">
                {goal.steps.map((step) => (
                  <li key={step.id} data-completed={step.completed}>
                    <input
                      type="checkbox"
                      checked={step.completed}
                      disabled={busyStepId === step.id}
                      onChange={(event) => handleToggleStep(step.id, event.target.checked)}
                      aria-label={`Concluir passo: ${step.title}`}
                    />
                    {step.title}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <SharedBadge
          isSharedWithMe={goal.isSharedWithMe}
          ownerLabel={goal.ownerLabel}
          isShared={!!goal.sharedWithUserId}
          className={styles.sharedBadge}
        />
      </div>
    </li>
  );
}

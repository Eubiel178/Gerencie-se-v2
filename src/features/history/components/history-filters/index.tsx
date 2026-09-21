import { ChipGroup } from "@/components";

import { HistoryFilter, HistoryPeriod } from "../../domain";

import styles from "./history-filters.module.css";

const PERIOD_OPTIONS = [
  { label: "7 dias", value: "7d" as const },
  { label: "30 dias", value: "30d" as const },
];

const TYPE_OPTIONS = [
  { label: "Todos", value: "all" as const },
  { label: "Tarefas", value: "task" as const },
  { label: "Objetivos", value: "goal" as const },
  { label: "Hábitos", value: "habit" as const },
  { label: "Rotina", value: "routine" as const },
  { label: "Leitura", value: "reading" as const },
];

interface HistoryFiltersProps {
  period: HistoryPeriod;
  type: HistoryFilter;
  onPeriodChange: (value: HistoryPeriod) => void;
  onTypeChange: (value: HistoryFilter) => void;
}

export function HistoryFilters({
  period,
  type,
  onPeriodChange,
  onTypeChange,
}: HistoryFiltersProps) {
  return (
    <div className={styles.filters}>
      <div className={styles.group}>
        <span className={styles.groupLabel}>Período</span>
        <ChipGroup
          options={PERIOD_OPTIONS}
          value={period}
          onChange={(value) => onPeriodChange(value as HistoryPeriod)}
          aria-label="Período do histórico"
        />
      </div>

      <div className={styles.group}>
        <span className={styles.groupLabel}>Tipo</span>
        <ChipGroup
          options={TYPE_OPTIONS}
          value={type}
          onChange={(value) => onTypeChange(value as HistoryFilter)}
          aria-label="Tipo de ocorrência"
        />
      </div>
    </div>
  );
}
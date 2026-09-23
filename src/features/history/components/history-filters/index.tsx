import { Input } from "@/components";

import { HistoryFilter, HistoryPeriod } from "../../domain";

import styles from "./history-filters.module.css";

const PERIOD_OPTIONS = [
  { label: "7 dias", value: "7d" as const },
  { label: "30 dias", value: "30d" as const },
  { label: "A qualquer momento", value: "all" as const },
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

/** Mesmo padrão de filtro usado em Tarefas (`Input.FieldSelect`) — não um
 *  `ChipGroup` específico do Histórico. Com 6 opções de tipo, chips viravam
 *  confusos/quebravam linha; um select compacto é o que o resto do app já
 *  usa pra esse exato caso (status, prioridade, tipo de tarefa). */
export function HistoryFilters({
  period,
  type,
  onPeriodChange,
  onTypeChange,
}: HistoryFiltersProps) {
  return (
    <div className={styles.filters}>
      <Input.Root>
        <Input.Label htmlFor="history-period">Período</Input.Label>
        <Input.Wrapper>
          <Input.FieldSelect
            name="history-period"
            aria-label="Período do histórico"
            optionsArray={PERIOD_OPTIONS}
            value={period}
            onChange={(event) => onPeriodChange(event.target.value as HistoryPeriod)}
          />
        </Input.Wrapper>
      </Input.Root>

      <Input.Root>
        <Input.Label htmlFor="history-type">Tipo</Input.Label>
        <Input.Wrapper>
          <Input.FieldSelect
            name="history-type"
            aria-label="Tipo de ocorrência"
            optionsArray={TYPE_OPTIONS}
            value={type}
            onChange={(event) => onTypeChange(event.target.value as HistoryFilter)}
          />
        </Input.Wrapper>
      </Input.Root>
    </div>
  );
}

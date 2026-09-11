"use client";

import { Button } from "@/components";

import styles from "./stats.module.css";

export interface WeekRange {
  start: string;
  end: string;
}

interface WeekBarsProps {
  values: number[];
  weekRanges: WeekRange[];
  /** Formata o valor de uma barra pro aria-label/title (ex.: "3.5h de foco",
   * "2 corridas"). */
  formatValue: (value: number) => string;
  page: number;
  maxPage: number;
  onPrev: () => void;
  onNext: () => void;
}

/**
 * Parte visual (barras + navegação por página) compartilhada por todos os
 * gráficos de "por semana" em Estatísticas (foco, hidratação, corrida,
 * hábitos, metas) — só o cálculo de `values` muda de um pro outro. Extraído
 * do `FocusWeeksChart` original pra não repetir a mesma barra 5 vezes.
 */
export function WeekBars({ values, weekRanges, formatValue, page, maxPage, onPrev, onNext }: WeekBarsProps) {
  const maxValue = Math.max(...values, 1);

  return (
    <div>
      <div className={styles.weeksNav}>
        <span className={styles.weeksRange}>
          {weekRanges[0].start} – {weekRanges[weekRanges.length - 1].end}
        </span>

        <div className={styles.weeksNavButtons}>
          <Button.Preset
            icon={{ name: "FaChevronLeft" }}
            root={{ "aria-label": "Semanas anteriores", disabled: page >= maxPage, onClick: onPrev }}
          />
          <Button.Preset
            icon={{ name: "FaChevronRight" }}
            root={{ "aria-label": "Semanas mais recentes", disabled: page === 0, onClick: onNext }}
          />
        </div>
      </div>

      <div className={styles.weekBars}>
        {values.map((value, index) => (
          <div
            key={index}
            className={styles.weekBar}
            role="img"
            aria-label={`De ${weekRanges[index].start} a ${weekRanges[index].end}: ${formatValue(value)}`}
            title={`${weekRanges[index].start} – ${weekRanges[index].end}: ${formatValue(value)}`}
          >
            <div
              className={styles.weekBarFill}
              style={{ height: `${Math.max(2, (value / maxValue) * 100)}%` }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

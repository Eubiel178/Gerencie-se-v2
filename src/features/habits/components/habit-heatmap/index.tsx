"use client";

import { useState } from "react";
import dayjs from "dayjs";

import { Button } from "@/components";
import { buildHabitHeatmap } from "@/features/habits/build-habit-heatmap";

import styles from "./habit-heatmap.module.css";

const VISIBLE_WEEKS = 26;

const WEEKDAY_LABELS = ["", "Seg", "", "Qua", "", "Sex", ""];
const MONTH_LABELS = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

function intensityLevel(ratio: number): 0 | 1 | 2 | 3 {
  if (ratio <= 0) return 0;
  if (ratio < 0.5) return 1;
  if (ratio < 1) return 2;
  return 3;
}

function formatShortDate(date: string): string {
  const [year, month, day] = date.split("-");
  return `${day}/${month}`;
}

interface HabitHeatmapProps {
  completionDates: string[];
  totalHabits: number;
  /** Quantas semanas de trás o servidor já buscou — limita até onde dá pra
   * navegar (mesmo mecanismo dos gráficos de Estatísticas). */
  fetchedWeeksBack: number;
}

export function HabitHeatmap({ completionDates, totalHabits, fetchedWeeksBack }: HabitHeatmapProps) {
  const [page, setPage] = useState(0);
  const maxPage = Math.max(0, Math.floor(fetchedWeeksBack / VISIBLE_WEEKS) - 1);

  const referenceNow = dayjs().subtract(page * VISIBLE_WEEKS * 7, "day");
  const weeks = buildHabitHeatmap(completionDates, totalHabits, VISIBLE_WEEKS, referenceNow);

  // Rótulo de mês só na primeira coluna de cada mês — calculado à parte
  // (não durante o JSX) porque mutar uma variável a cada iteração do
  // `.map` conta como efeito colateral durante a renderização.
  const monthLabels = weeks.reduce<(string | null)[]>((labels, week, index) => {
    const month = dayjs(week[0].date).month();
    const previousMonth = index === 0 ? -1 : dayjs(weeks[index - 1][0].date).month();

    labels.push(month !== previousMonth ? MONTH_LABELS[month] : null);
    return labels;
  }, []);

  return (
    <div className={styles.wrapper}>
      <div className={styles.nav}>
        <span className={styles.rangeLabel}>
          {formatShortDate(weeks[0][0].date)} – {formatShortDate(weeks[weeks.length - 1][6].date)}
        </span>

        <div className={styles.navButtons}>
          <Button.Preset
            icon={{ name: "FaChevronLeft" }}
            root={{
              "aria-label": "Meses anteriores",
              disabled: page >= maxPage,
              onClick: () => setPage((current) => Math.min(maxPage, current + 1)),
            }}
          />
          <Button.Preset
            icon={{ name: "FaChevronRight" }}
            root={{
              "aria-label": "Meses mais recentes",
              disabled: page === 0,
              onClick: () => setPage((current) => Math.max(0, current - 1)),
            }}
          />
        </div>
      </div>

      <div className={styles.scrollArea}>
        <div className={styles.chart}>
          <div className={styles.weekdayColumn}>
            <span className={styles.monthLabelSpacer} aria-hidden="true" />
            {WEEKDAY_LABELS.map((label, index) => (
              <span key={index} className={styles.weekdayLabel}>{label}</span>
            ))}
          </div>

          <div className={styles.weeksRow}>
            {weeks.map((week, weekIndex) => {
              return (
                <div key={weekIndex} className={styles.weekColumn}>
                  <span className={styles.monthLabel}>{monthLabels[weekIndex] ?? ""}</span>

                  {week.map((day) =>
                    day.isFuture ? (
                      <span key={day.date} className={styles.cell} data-level="future" aria-hidden="true" />
                    ) : (
                      <span
                        key={day.date}
                        className={styles.cell}
                        data-level={intensityLevel(day.ratio)}
                        role="img"
                        aria-label={`${day.date}: ${day.count} de ${totalHabits} hábito(s) concluído(s)`}
                        title={`${day.date}: ${day.count}/${totalHabits} hábito(s)`}
                      />
                    )
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className={styles.legend}>
        <span>Menos</span>
        <span className={styles.cell} data-level="0" aria-hidden="true" />
        <span className={styles.cell} data-level="1" aria-hidden="true" />
        <span className={styles.cell} data-level="2" aria-hidden="true" />
        <span className={styles.cell} data-level="3" aria-hidden="true" />
        <span>Mais (dia completo)</span>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import dayjs from "dayjs";

import { Button } from "@/components";
import { IFocusSession } from "@/features/focus/domain";

import { calculateWeeklyFocusHoursByWeek } from "./calculations";

import styles from "./stats.module.css";

const WEEKS_PER_PAGE = 4;

interface FocusWeeksChartProps {
  sessions: IFocusSession[];
  /** Quantas semanas de trás o servidor já buscou — limita até onde dá pra
   * navegar (`sessions` não tem dado nenhum além disso). */
  fetchedWeeksBack: number;
}

/**
 * Ilha de cliente só pra paginar as 4 barras entre páginas de semanas mais
 * antigas — o resto da tela de Estatísticas continua Server Component. A
 * mesma `calculateWeeklyFocusHoursByWeek` (pura) é reaproveitada aqui,
 * recalculando a partir de uma data de referência mais antiga a cada
 * clique em "Semanas anteriores".
 */
export function FocusWeeksChart({ sessions, fetchedWeeksBack }: FocusWeeksChartProps) {
  const [page, setPage] = useState(0);
  const maxPage = Math.max(0, Math.floor(fetchedWeeksBack / WEEKS_PER_PAGE) - 1);

  const referenceNow = dayjs().subtract(page * WEEKS_PER_PAGE * 7, "day");
  const hoursByWeek = calculateWeeklyFocusHoursByWeek(sessions, WEEKS_PER_PAGE, referenceNow);
  const maxHours = Math.max(...hoursByWeek, 1);

  const weekRanges = hoursByWeek.map((_, index) => {
    const weeksAgo = WEEKS_PER_PAGE - 1 - index;
    const weekEnd = referenceNow.subtract(weeksAgo * 7, "day");
    const weekStart = weekEnd.subtract(7, "day");

    return { start: weekStart.format("DD/MM"), end: weekEnd.format("DD/MM") };
  });

  return (
    <div>
      <div className={styles.focusWeeksNav}>
        <span className={styles.focusWeeksRange}>
          {weekRanges[0].start} – {weekRanges[weekRanges.length - 1].end}
        </span>

        <div className={styles.focusWeeksNavButtons}>
          <Button.Preset
            icon={{ name: "FaChevronLeft" }}
            root={{
              "aria-label": "Semanas anteriores",
              disabled: page >= maxPage,
              onClick: () => setPage((current) => Math.min(maxPage, current + 1)),
            }}
          />
          <Button.Preset
            icon={{ name: "FaChevronRight" }}
            root={{
              "aria-label": "Semanas mais recentes",
              disabled: page === 0,
              onClick: () => setPage((current) => Math.max(0, current - 1)),
            }}
          />
        </div>
      </div>

      <div className={styles.focusWeeks}>
        {hoursByWeek.map((hours, index) => (
          <div
            key={index}
            className={styles.focusWeekBar}
            role="img"
            aria-label={`De ${weekRanges[index].start} a ${weekRanges[index].end}: ${hours}h de foco`}
            title={`${weekRanges[index].start} – ${weekRanges[index].end}: ${hours}h`}
          >
            <div
              className={styles.focusWeekBarFill}
              style={{ height: `${Math.max(2, (hours / maxHours) * 100)}%` }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

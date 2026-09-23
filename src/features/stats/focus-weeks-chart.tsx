"use client";

import { IFocusSession } from "@/features/focus/domain";

import { calculateWeeklyFocusHoursByWeek } from "./calculations";
import { useWeekRanges } from "./use-week-ranges";
import { WeekBars } from "./week-bars";

const WEEKS_PER_PAGE = 4;

interface FocusWeeksChartProps {
  sessions: IFocusSession[];
  /** Quantas semanas de trás o servidor já buscou — limita até onde dá pra
   * navegar (`sessions` não tem dado nenhum além disso). */
  fetchedWeeksBack: number;
}

export function FocusWeeksChart({ sessions, fetchedWeeksBack }: FocusWeeksChartProps) {
  const { page, maxPage, referenceNow, weekRanges, goToPreviousWeeks, goToNextWeeks } =
    useWeekRanges(fetchedWeeksBack, WEEKS_PER_PAGE);

  const hoursByWeek = calculateWeeklyFocusHoursByWeek(sessions, WEEKS_PER_PAGE, referenceNow);

  return (
    <WeekBars
      values={hoursByWeek}
      weekRanges={weekRanges}
      formatValue={(hours) => `${hours}h de foco`}
      page={page}
      maxPage={maxPage}
      onPrev={goToPreviousWeeks}
      onNext={goToNextWeeks}
    />
  );
}

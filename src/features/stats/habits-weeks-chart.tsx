"use client";

import { calculateHabitCompletionsByWeek } from "./calculations";
import { useWeekRanges } from "./use-week-ranges";
import { WeekBars } from "./week-bars";

const WEEKS_PER_PAGE = 4;

interface HabitsWeeksChartProps {
  completionDates: string[];
  fetchedWeeksBack: number;
}

export function HabitsWeeksChart({ completionDates, fetchedWeeksBack }: HabitsWeeksChartProps) {
  const { page, maxPage, referenceNow, weekRanges, goToPreviousWeeks, goToNextWeeks } =
    useWeekRanges(fetchedWeeksBack, WEEKS_PER_PAGE);

  const completionsByWeek = calculateHabitCompletionsByWeek(completionDates, WEEKS_PER_PAGE, referenceNow);

  return (
    <WeekBars
      values={completionsByWeek}
      weekRanges={weekRanges}
      formatValue={(count) => `${count} conclusõe(s) de hábito`}
      page={page}
      maxPage={maxPage}
      onPrev={goToPreviousWeeks}
      onNext={goToNextWeeks}
    />
  );
}

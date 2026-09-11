"use client";

import { IHydrationDay } from "@/features/hydration/domain";

import { calculateHydrationAdherenceByWeek } from "./calculations";
import { useWeekRanges } from "./use-week-ranges";
import { WeekBars } from "./week-bars";

const WEEKS_PER_PAGE = 4;

interface HydrationWeeksChartProps {
  days: IHydrationDay[];
  goalMl: number;
  fetchedWeeksBack: number;
}

export function HydrationWeeksChart({ days, goalMl, fetchedWeeksBack }: HydrationWeeksChartProps) {
  const { page, maxPage, referenceNow, weekRanges, goToPreviousWeeks, goToNextWeeks } =
    useWeekRanges(fetchedWeeksBack, WEEKS_PER_PAGE);

  const daysHitByWeek = calculateHydrationAdherenceByWeek(days, goalMl, WEEKS_PER_PAGE, referenceNow);

  return (
    <WeekBars
      values={daysHitByWeek}
      weekRanges={weekRanges}
      formatValue={(count) => `${count}/7 dias com meta batida`}
      page={page}
      maxPage={maxPage}
      onPrev={goToPreviousWeeks}
      onNext={goToNextWeeks}
    />
  );
}

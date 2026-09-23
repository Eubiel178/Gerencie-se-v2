"use client";

import { IRunningSession } from "@/features/running/domain";

import { calculateWeeklyRunningDistanceByWeek } from "./calculations";
import { useWeekRanges } from "./use-week-ranges";
import { WeekBars } from "./week-bars";

const WEEKS_PER_PAGE = 4;

interface RunningWeeksChartProps {
  sessions: IRunningSession[];
  fetchedWeeksBack: number;
}

export function RunningWeeksChart({ sessions, fetchedWeeksBack }: RunningWeeksChartProps) {
  const { page, maxPage, referenceNow, weekRanges, goToPreviousWeeks, goToNextWeeks } =
    useWeekRanges(fetchedWeeksBack, WEEKS_PER_PAGE);

  const kmByWeek = calculateWeeklyRunningDistanceByWeek(sessions, WEEKS_PER_PAGE, referenceNow);

  return (
    <WeekBars
      values={kmByWeek}
      weekRanges={weekRanges}
      formatValue={(km) => `${km}km corridos`}
      page={page}
      maxPage={maxPage}
      onPrev={goToPreviousWeeks}
      onNext={goToNextWeeks}
    />
  );
}

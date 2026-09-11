"use client";

import { calculateGoalsCreatedByWeek } from "./calculations";
import { useWeekRanges } from "./use-week-ranges";
import { WeekBars } from "./week-bars";

const WEEKS_PER_PAGE = 4;
// Metas não têm uma busca "por período" própria (loadAll já traz todas as
// ativas, sem limite de data) — o limite de navegação aqui é só uma janela
// razoável pra não deixar o usuário rolar pra sempre à toa.
const NAVIGABLE_WEEKS_BACK = 28;

interface GoalsWeeksChartProps {
  goals: { createdAt: Date }[];
}

export function GoalsWeeksChart({ goals }: GoalsWeeksChartProps) {
  const { page, maxPage, referenceNow, weekRanges, goToPreviousWeeks, goToNextWeeks } =
    useWeekRanges(NAVIGABLE_WEEKS_BACK, WEEKS_PER_PAGE);

  const createdByWeek = calculateGoalsCreatedByWeek(goals, WEEKS_PER_PAGE, referenceNow);

  return (
    <WeekBars
      values={createdByWeek}
      weekRanges={weekRanges}
      formatValue={(count) => `${count} meta(s) criada(s)`}
      page={page}
      maxPage={maxPage}
      onPrev={goToPreviousWeeks}
      onNext={goToNextWeeks}
    />
  );
}

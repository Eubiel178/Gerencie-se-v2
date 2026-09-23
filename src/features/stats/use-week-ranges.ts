"use client";

import { useState } from "react";

import dayjs from "dayjs";

import { WeekRange } from "./week-bars";

const DAYS_PER_WEEK = 7;

/**
 * Paginação por página de `weeksPerPage` semanas, compartilhada por todo
 * gráfico "por semana" em Estatísticas. `fetchedWeeksBack` é quantas
 * semanas de trás o servidor já buscou — além disso não há dado nenhum
 * pra mostrar, então vira o limite de navegação (`maxPage`).
 */
export function useWeekRanges(fetchedWeeksBack: number, weeksPerPage: number = 4) {
  const [page, setPage] = useState(0);
  const maxPage = Math.max(0, Math.floor(fetchedWeeksBack / weeksPerPage) - 1);

  const referenceNow = dayjs().subtract(page * weeksPerPage * DAYS_PER_WEEK, "day");

  const weekRanges: WeekRange[] = Array.from({ length: weeksPerPage }, (_, index) => {
    const weeksAgo = weeksPerPage - 1 - index;
    const weekEnd = referenceNow.subtract(weeksAgo * DAYS_PER_WEEK, "day");
    const weekStart = weekEnd.subtract(DAYS_PER_WEEK, "day");

    return { start: weekStart.format("DD/MM"), end: weekEnd.format("DD/MM") };
  });

  return {
    page,
    maxPage,
    referenceNow,
    weekRanges,
    goToPreviousWeeks: () => setPage((current) => Math.min(maxPage, current + 1)),
    goToNextWeeks: () => setPage((current) => Math.max(0, current - 1)),
  };
}

"use client";

import { useId, useMemo, useState } from "react";
import dayjs from "dayjs";

import { Button } from "@/components";
import { buildHabitHeatmap } from "@/features/habits/build-habit-heatmap";
import { buildHabitConsistencyTrend, ConsistencyWeekPoint } from "@/features/habits/build-habit-consistency-trend";

import styles from "./habit-consistency-chart.module.css";

const VISIBLE_WEEKS = 26;

// Área de desenho do SVG - viewBox fixo, escala com a largura real via
// `width="100%"` no elemento (nunca recalculado em JS por resize).
const CHART_WIDTH = 640;
const CHART_HEIGHT = 140;
const PLOT_LEFT = 30;
const PLOT_RIGHT = CHART_WIDTH - 12;
const PLOT_TOP = 10;
const PLOT_BOTTOM = CHART_HEIGHT - 10;
const PLOT_WIDTH = PLOT_RIGHT - PLOT_LEFT;
const PLOT_HEIGHT = PLOT_BOTTOM - PLOT_TOP;

function formatShortDate(date: string): string {
  const [year, month, day] = date.split("-");
  return `${day}/${month}`;
}

function xFor(index: number, count: number): number {
  if (count <= 1) return PLOT_LEFT + PLOT_WIDTH / 2;
  return PLOT_LEFT + (index / (count - 1)) * PLOT_WIDTH;
}

function yFor(percent: number): number {
  return PLOT_BOTTOM - (Math.max(0, Math.min(100, percent)) / 100) * PLOT_HEIGHT;
}

interface HabitConsistencyChartProps {
  completionDates: string[];
  totalHabits: number;
  /** Quantas semanas de trás o servidor já buscou — limita até onde dá pra
   * navegar (mesmo mecanismo dos gráficos de Estatísticas). */
  fetchedWeeksBack: number;
}

export function HabitConsistencyChart({
  completionDates,
  totalHabits,
  fetchedWeeksBack,
}: HabitConsistencyChartProps) {
  const gradientId = useId();
  const [page, setPage] = useState(0);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [showTable, setShowTable] = useState(false);
  const maxPage = Math.max(0, Math.floor(fetchedWeeksBack / VISIBLE_WEEKS) - 1);

  const points = useMemo(() => {
    const referenceNow = dayjs().subtract(page * VISIBLE_WEEKS * 7, "day");
    const weeks = buildHabitHeatmap(completionDates, totalHabits, VISIBLE_WEEKS, referenceNow);
    return buildHabitConsistencyTrend(weeks);
  }, [completionDates, totalHabits, page]);

  const linePath = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${xFor(index, points.length)} ${yFor(point.percent)}`)
    .join(" ");

  const areaPath =
    `M ${xFor(0, points.length)} ${PLOT_BOTTOM} ` +
    points.map((point, index) => `L ${xFor(index, points.length)} ${yFor(point.percent)}`).join(" ") +
    ` L ${xFor(points.length - 1, points.length)} ${PLOT_BOTTOM} Z`;

  const lastPoint = points[points.length - 1];
  const hovered = hoverIndex !== null ? points[hoverIndex] : null;
  const columnWidth = points.length > 0 ? PLOT_WIDTH / points.length : 0;

  // Só uma etiqueta a cada ~4 semanas, senão os rótulos se amontoam - o
  // primeiro e o último ponto sempre aparecem (regra "meça antes de
  // rotular": com 26 pontos, um rótulo por ponto se sobrepõe).
  const xAxisTickEvery = 4;

  return (
    <div className={styles.wrapper}>
      <div className={styles.nav}>
        {points.length > 0 && (
          <span className={styles.rangeLabel}>
            {formatShortDate(points[0].weekStartDate)} – {formatShortDate(points[points.length - 1].weekEndDate)}
          </span>
        )}

        <div className={styles.navActions}>
          <button
            type="button"
            className={styles.tableToggle}
            aria-pressed={showTable}
            onClick={() => setShowTable((current) => !current)}
          >
            {showTable ? "Ver gráfico" : "Ver como tabela"}
          </button>

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
      </div>

      {showTable ? (
        <table className={styles.table}>
          <caption className={styles.tableCaption}>Consistência semanal (% de hábitos concluídos)</caption>
          <thead>
            <tr>
              <th scope="col">Semana</th>
              <th scope="col">Consistência</th>
            </tr>
          </thead>
          <tbody>
            {points.map((point) => (
              <tr key={point.weekStartDate}>
                <td>
                  {formatShortDate(point.weekStartDate)} – {formatShortDate(point.weekEndDate)}
                </td>
                <td>{point.percent}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className={styles.chartArea}>
          <svg
            viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
            className={styles.svg}
            role="img"
            aria-label={`Consistência semanal de hábitos, de ${points[0]?.weekStartDate} a ${points[points.length - 1]?.weekEndDate}`}
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-highlight)" stopOpacity="0.28" />
                <stop offset="100%" stopColor="var(--color-highlight)" stopOpacity="0.02" />
              </linearGradient>
            </defs>

            {/* Grade horizontal recessiva - 0%/50%/100%, hairline, nunca tracejada. */}
            {[0, 50, 100].map((tick) => (
              <line
                key={tick}
                x1={PLOT_LEFT}
                x2={PLOT_RIGHT}
                y1={yFor(tick)}
                y2={yFor(tick)}
                className={styles.gridline}
              />
            ))}
            {[0, 50, 100].map((tick) => (
              <text key={tick} x={PLOT_LEFT - 6} y={yFor(tick)} className={styles.axisLabel} textAnchor="end" dominantBaseline="middle">
                {tick}%
              </text>
            ))}

            {/* Rótulos de data - só a cada N semanas, pra não amontoar. */}
            {points.map((point, index) =>
              index % xAxisTickEvery === 0 || index === points.length - 1 ? (
                <text
                  key={point.weekStartDate}
                  x={xFor(index, points.length)}
                  y={CHART_HEIGHT - 2}
                  className={styles.axisLabel}
                  textAnchor="middle"
                >
                  {formatShortDate(point.weekStartDate)}
                </text>
              ) : null
            )}

            <path d={areaPath} fill={`url(#${gradientId})`} />
            <path d={linePath} className={styles.line} fill="none" />

            {/* Crosshair + marcador do ponto sob o ponteiro/foco. */}
            {hovered && (
              <line
                x1={xFor(hoverIndex!, points.length)}
                x2={xFor(hoverIndex!, points.length)}
                y1={PLOT_TOP}
                y2={PLOT_BOTTOM}
                className={styles.crosshair}
              />
            )}

            {hovered && (
              <circle
                cx={xFor(hoverIndex!, points.length)}
                cy={yFor(hovered.percent)}
                r={4}
                className={styles.hoverDot}
              />
            )}

            {/* Marcador fixo no ponto mais recente, com rótulo direto -
                "o final da linha" é o único ponto que sempre carrega o
                valor por extenso, o resto fica só no eixo/tooltip. */}
            {lastPoint && (
              <>
                <circle
                  cx={xFor(points.length - 1, points.length)}
                  cy={yFor(lastPoint.percent)}
                  r={4}
                  className={styles.endDot}
                />
                <text
                  x={xFor(points.length - 1, points.length)}
                  y={yFor(lastPoint.percent) - 10}
                  textAnchor="end"
                  className={styles.endLabel}
                >
                  {lastPoint.percent}%
                </text>
              </>
            )}

            {/* Colunas invisíveis de hit-test - uma por semana, maiores que
                o traço em si (regra "alvo de toque maior que a marca"). */}
            {points.map((point, index) => (
              <rect
                key={point.weekStartDate}
                x={PLOT_LEFT + index * columnWidth}
                y={0}
                width={columnWidth}
                height={CHART_HEIGHT}
                fill="transparent"
                tabIndex={0}
                role="img"
                aria-label={`Semana de ${formatShortDate(point.weekStartDate)} a ${formatShortDate(point.weekEndDate)}: ${point.percent}% de consistência`}
                onPointerEnter={() => setHoverIndex(index)}
                onPointerLeave={() => setHoverIndex((current) => (current === index ? null : current))}
                onFocus={() => setHoverIndex(index)}
                onBlur={() => setHoverIndex((current) => (current === index ? null : current))}
              />
            ))}
          </svg>

          {hovered && hoverIndex !== null && (
            <div
              className={styles.tooltip}
              style={{ left: `${(xFor(hoverIndex, points.length) / CHART_WIDTH) * 100}%` }}
            >
              <strong className={styles.tooltipValue}>{hovered.percent}%</strong>
              <span className={styles.tooltipLabel}>
                {formatShortDate(hovered.weekStartDate)} – {formatShortDate(hovered.weekEndDate)}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

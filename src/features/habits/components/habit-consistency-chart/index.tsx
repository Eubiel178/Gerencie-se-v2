"use client";

import { useId, useMemo, useState } from "react";
import dayjs from "dayjs";

import { Button } from "@/components";
import { buildHabitHeatmap } from "@/features/habits/build-habit-heatmap";
import { buildHabitConsistencyTrend, ConsistencyWeekPoint } from "@/features/habits/build-habit-consistency-trend";

import styles from "./habit-consistency-chart.module.css";

// `buildHabitHeatmap` sempre começa a semana no domingo (ver comentário
// lá) - mesma ordem aqui, usada só na versão em tabela (o gráfico em
// linha não desce a esse nível de detalhe por dia).
const DAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

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

// Inclui o ano (2 dígitos) de propósito - a janela padrão é de 26
// semanas (~6 meses) e, dependendo de quando for hoje, cruza a virada do
// ano (ex.: início em setembro de um ano, fim em março do ano seguinte).
// Sem o ano, "21/09 – 15/03" lê como se a ordem estivesse invertida (a
// primeira data "parece" mais recente que a segunda) mesmo quando a
// ordem cronológica está correta - foi exatamente essa confusão relatada.
function formatShortDate(date: string): string {
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year.slice(2)}`;
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
  // Abre só na semana atual (1 ponto) - cada clique em "anterior" soma
  // mais uma semana ao início da linha (2 pontos, depois 3...), em vez
  // de pular direto pra uma janela de vários meses (achado relatado: um
  // gráfico que já nasce mostrando 6 meses de uma vez era barulho demais
  // antes mesmo de a pessoa pedir por isso). O fim da linha é sempre a
  // semana de hoje - só o início recua.
  const [visibleWeeks, setVisibleWeeks] = useState(1);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [showTable, setShowTable] = useState(false);
  // Não dá pra crescer além do que o servidor já buscou.
  const maxVisibleWeeks = fetchedWeeksBack;

  const weeks = useMemo(
    () => buildHabitHeatmap(completionDates, totalHabits, visibleWeeks, dayjs()),
    [completionDates, totalHabits, visibleWeeks]
  );
  const points = useMemo(() => buildHabitConsistencyTrend(weeks), [weeks]);

  const linePath = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${xFor(index, points.length)} ${yFor(point.percent)}`)
    .join(" ");

  const areaPath =
    `M ${xFor(0, points.length)} ${PLOT_BOTTOM} ` +
    points.map((point, index) => `L ${xFor(index, points.length)} ${yFor(point.percent)}`).join(" ") +
    ` L ${xFor(points.length - 1, points.length)} ${PLOT_BOTTOM} Z`;

  // A data real de hoje, não o fim da semana em andamento (`weekEndDate`
  // é sábado - uma data futura enquanto a semana não termina, e mostrar
  // uma data futura junto de "Hoje" seria tão confuso quanto o problema
  // que essa etiqueta tenta resolver).
  const todayLabel = formatShortDate(dayjs().format("YYYY-MM-DD"));

  const lastPoint = points[points.length - 1];
  const hovered = hoverIndex !== null ? points[hoverIndex] : null;
  const columnWidth = points.length > 0 ? PLOT_WIDTH / points.length : 0;

  // Só uma etiqueta a cada ~4 semanas, senão os rótulos se amontoam - o
  // primeiro e o último ponto sempre aparecem (regra "meça antes de
  // rotular": com 26 pontos, um rótulo por ponto se sobrepõe).
  const xAxisTickEvery = 5;

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
                "aria-label": "Uma semana mais atrás",
                disabled: visibleWeeks >= maxVisibleWeeks,
                onClick: () => setVisibleWeeks((current) => Math.min(maxVisibleWeeks, current + 1)),
              }}
            />
            <Button.Preset
              icon={{ name: "FaChevronRight" }}
              root={{
                "aria-label": "Uma semana mais recente",
                disabled: visibleWeeks <= 1,
                onClick: () => setVisibleWeeks((current) => Math.max(1, current - 1)),
              }}
            />
          </div>
        </div>
      </div>

      {lastPoint && (
        <p className={styles.summary}>
          <strong>Esta semana: {lastPoint.percent}% concluído.</strong>{" "}
          O cálculo considera apenas os dias que já aconteceram.
        </p>
      )}

      {showTable ? (
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <caption className={styles.tableCaption}>
              Consistência semanal (% de hábitos concluídos), com o detalhe de cada dia
            </caption>
            <thead>
              <tr>
                <th scope="col">Semana</th>
                {DAY_LABELS.map((label) => (
                  <th key={label} scope="col">
                    {label}
                  </th>
                ))}
                <th scope="col">Consistência</th>
              </tr>
            </thead>
            <tbody>
              {weeks.map((week, weekIndex) => (
                <tr key={points[weekIndex].weekStartDate}>
                  <td>
                    {formatShortDate(points[weekIndex].weekStartDate)} –{" "}
                    {formatShortDate(points[weekIndex].weekEndDate)}
                  </td>
                  {week.map((day) => (
                    <td key={day.date}>{day.isFuture ? "—" : `${Math.round(Math.min(day.ratio, 1) * 100)}%`}</td>
                  ))}
                  <td>{points[weekIndex].percent}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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

            {/* Rótulos de data - só a cada N semanas, pra não amontoar. O
                último ponto da página atual é a semana EM ANDAMENTO (seu
                fim, weekEndDate, ainda é uma data futura) - rotular com a
                data de início dela ("13/09" quando hoje já é "14/09") lia
                como se tivesse um dia de atraso. Por isso ganha "Hoje" -
                mas sozinha essa palavra quebra o padrão "DD/MM/AA" dos
                outros rótulos e lia como se a ordem tivesse virado bagunça
                (achado relatado). A data real some junto, numa segunda
                linha menor, pra nunca perder a referência cronológica. */}
            {points.map((point, index) => {
              // O fim da linha é sempre a semana de hoje (ver `points`
              // acima - âncora fixa em `dayjs()`, só o início recua).
              const isLast = index === points.length - 1;
              const isCurrentInProgressWeek = isLast;
              const isFirst = index === 0;
              const isRegularTick = index % xAxisTickEvery === 0;
              // Suprime um tick "regular" (múltiplo de N) caindo perto
              // demais do último - sem isso, com labels "DD/MM/AA" mais
              // largos que o espaço entre pontos, o penúltimo tick regular
              // colidia visualmente com o último ("Hoje"/data final).
              const tooCloseToLast = !isLast && points.length - 1 - index < xAxisTickEvery;

              if (!isFirst && !isLast && (!isRegularTick || tooCloseToLast)) return null;

              if (isCurrentInProgressWeek) {
                // `textAnchor="end"` aqui, não "middle" como os outros -
                // esse rótulo tem duas linhas e é mais largo que uma data
                // sozinha; centralizado, a segunda linha ("Hoje" + a data)
                // ultrapassava a borda direita do viewBox e cortava o
                // texto (ex.: "14/09/26" virava "14/09/2") - igual ao
                // rótulo de valor (`endLabel`) do ponto mais recente, que
                // já ancora pela direita por causa disso.
                return (
                  <text
                    key={point.weekStartDate}
                    x={PLOT_RIGHT}
                    y={CHART_HEIGHT - 10}
                    className={styles.axisLabel}
                    textAnchor="end"
                  >
                    <tspan x={PLOT_RIGHT} dy="0" className={styles.axisLabelStrong}>
                      Hoje
                    </tspan>
                    <tspan x={PLOT_RIGHT} dy="9">
                      {todayLabel}
                    </tspan>
                  </text>
                );
              }

              // O último ponto de QUALQUER página (não só "Hoje") tem seu
              // centro exatamente em `PLOT_RIGHT` - um rótulo "DD/MM/AA"
              // centralizado ali (`textAnchor="middle"`) ultrapassa a
              // borda direita do viewBox e é cortado pelo navegador (ex.:
              // "21/06/26" vira "21/06/2") - o mesmo problema do rótulo
              // "Hoje" acima, só que também acontecia ao navegar pra
              // páginas anteriores, onde o último ponto é uma data comum.
              return (
                <text
                  key={point.weekStartDate}
                  x={isLast ? PLOT_RIGHT : xFor(index, points.length)}
                  y={CHART_HEIGHT - 2}
                  className={styles.axisLabel}
                  textAnchor={isLast ? "end" : "middle"}
                >
                  {formatShortDate(point.weekStartDate)}
                </text>
              );
            })}

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

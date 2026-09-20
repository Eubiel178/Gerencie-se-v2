import { NextResponse } from "next/server";

import { requireUserId } from "@/lib/auth";
import { toCsv } from "@/lib/export/csv";
import { toXlsx } from "@/lib/export/xlsx";

import { getTaskFetcher } from "@/features/tasks/data/get-task-fetcher";
import { getHabitFetcher } from "@/features/habits/data/get-habit-fetcher";
import { getGoalFetcher } from "@/features/goals/data/get-goal-fetcher";
import { getRoutineFetcher } from "@/features/routine/data/get-routine-fetcher";
import { getEventFetcher } from "@/features/events/data/get-event-fetcher";
import { getFocusFetcher, getMascotFetcher } from "@/features/focus/data/get-focus-fetcher";
import { getHydrationFetcher } from "@/features/hydration/data/get-hydration-fetcher";
import { getRunningFetcher } from "@/features/running/data/get-running-fetcher";
import { getReadingFetcher } from "@/features/reading/data/get-reading-fetcher";
import { getHealthFetcher } from "@/features/health/data/get-health-fetcher";
import { getCycleFetcher } from "@/features/menstrual-cycle/data/get-cycle-fetcher";

// "Todo o histórico" pra sessões de foco/corrida, que normalmente são
// buscadas com limite (últimas 10/30) pro uso comum do app — exportação
// precisa do dado completo, não só o mais recente.
const EPOCH = new Date(0);
// Hidratação não tem uma busca "tudo" (só por dia, ver LocalHydration) —
// ~10 anos cobre qualquer uso real deste app pessoal.
const HYDRATION_DAYS = 3650;

const ENTITY_NAMES = [
  "tasks",
  "habits",
  "goals",
  "routine",
  "events",
  "focus",
  "hydration",
  "running",
  "reading",
  "health",
  "menstrual-cycle",
] as const;

type EntityName = (typeof ENTITY_NAMES)[number];

function isEntityName(value: string | null): value is EntityName {
  return !!value && (ENTITY_NAMES as readonly string[]).includes(value);
}

/**
 * Tarefas, hábitos, metas e rotina têm um campo de compartilhamento
 * (`sharedWithUserId`) e um rótulo calculado (`ownerLabel`, nome/e-mail de
 * QUEM compartilhou) — nunca pertencem só a este usuário, então nunca
 * entram na exportação (ver auditoria: vazaria nome/e-mail de outra
 * pessoa). `isSharedWithMe` também sai por ser metadado de visualização,
 * não dado em si.
 */
interface SharingFields {
  sharedWithUserId?: unknown;
  ownerLabel?: unknown;
  isSharedWithMe?: unknown;
}

function stripSharingFields<T extends SharingFields>(
  row: T
): Omit<T, "sharedWithUserId" | "ownerLabel" | "isSharedWithMe"> {
  const { sharedWithUserId: _sharedWithUserId, ownerLabel: _ownerLabel, isSharedWithMe: _isSharedWithMe, ...rest } = row;
  return rest;
}

async function gatherExportData() {
  const [tasks, habits, goals, routine, events, focusSessions, hydrationDays, runningSessions, reading, health, cycle, mascot] =
    await Promise.all([
      getTaskFetcher().loadAll(),
      getHabitFetcher().loadAll(),
      getGoalFetcher().loadAll(),
      getRoutineFetcher().loadAll(),
      getEventFetcher().loadAll(),
      getFocusFetcher().loadHistoryInRange(EPOCH),
      getHydrationFetcher().loadRange(HYDRATION_DAYS),
      getRunningFetcher().loadHistoryInRange(EPOCH),
      getReadingFetcher().loadAll(),
      getHealthFetcher().loadAll(),
      getCycleFetcher().loadAll(),
      getMascotFetcher().getMascot(),
    ]);

  return {
    tasks: tasks.map(stripSharingFields).map(({ syncStatus: _s, syncError: _e, googleEventId: _g, googleEventUpdatedAt: _u, ...rest }) => rest),
    habits: habits.map(stripSharingFields),
    goals: goals.map(stripSharingFields),
    routine: routine.map(stripSharingFields),
    events,
    focus: focusSessions,
    hydration: hydrationDays,
    running: runningSessions,
    reading,
    health,
    "menstrual-cycle": cycle.entries,
    mascot,
  };
}

/** Achata a lista pro formato de linha que `toCsv` espera — cada entidade
 * tem sua própria forma (metas têm etapas aninhadas, por exemplo, que
 * viram uma contagem em vez de uma coluna com objetos dentro). */
function toCsvRows(entity: EntityName, data: Awaited<ReturnType<typeof gatherExportData>>): object[] {
  switch (entity) {
    case "goals":
      return data.goals.map((goal) => ({
        id: goal.id,
        title: goal.title,
        description: goal.description,
        priority: goal.priority,
        deadline: goal.deadline,
        progressPercent: goal.progressPercent,
        stepsTotal: goal.steps.length,
        stepsCompleted: goal.steps.filter((step) => step.completed).length,
        createdAt: goal.createdAt,
      }));
    case "menstrual-cycle":
      return data["menstrual-cycle"];
    default:
      return data[entity] as object[];
  }
}

export async function GET(request: Request) {
  await requireUserId();

  const { searchParams } = new URL(request.url);
  const formatParam = searchParams.get("format");
  const format = formatParam === "csv" || formatParam === "xlsx" ? formatParam : "json";

  const data = await gatherExportData();

  if (format === "json") {
    return new NextResponse(JSON.stringify(data, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": 'attachment; filename="gerencie-se-dados.json"',
      },
    });
  }

  const entityParam = searchParams.get("entity");
  if (!isEntityName(entityParam)) {
    return NextResponse.json(
      { error: `Parâmetro "entity" inválido. Use um de: ${ENTITY_NAMES.join(", ")}.` },
      { status: 400 }
    );
  }

  const rows = toCsvRows(entityParam, data);

  if (format === "xlsx") {
    const xlsx = await toXlsx(rows, entityParam);

    return new NextResponse(new Uint8Array(xlsx), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="gerencie-se-${entityParam}.xlsx"`,
      },
    });
  }

  const csv = toCsv(rows);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="gerencie-se-${entityParam}.csv"`,
    },
  });
}

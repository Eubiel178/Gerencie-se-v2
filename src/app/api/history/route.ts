import { NextResponse } from "next/server";

import { getHistoryFetcher } from "@/features/history/data/local-history";
import type { HistoryFilter, HistoryPeriod } from "@/features/history/domain";
import { requireUserId } from "@/lib/auth";

export async function GET(request: Request) {
  await requireUserId();

  const { searchParams } = new URL(request.url);
  const period = (searchParams.get("period") as HistoryPeriod | null) ?? "30d";
  const type = (searchParams.get("type") as HistoryFilter | null) ?? "all";

  const fetcher = getHistoryFetcher();
  const entries = await fetcher.loadEntries({ period, type });

  return NextResponse.json(entries);
}
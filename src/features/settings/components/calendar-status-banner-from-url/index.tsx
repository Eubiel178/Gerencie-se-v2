"use client";

import { useSearchParams } from "next/navigation";

import { CalendarStatusBanner } from "../calendar-status-banner";

/**
 * Lê `?google_calendar_connected=`/`?google_calendar_error=` no CLIENTE
 * (não como prop de um Server Component) - mesmo motivo do comentário em
 * `settings-sections.tsx`: um Server Component que declara `searchParams`
 * faz o Next.js reexecutar a página inteira no servidor a cada mudança
 * de query string, mesmo pra params que aquele componente nem usa.
 */
export function CalendarStatusBannerFromUrl() {
  const searchParams = useSearchParams();
  const connected = searchParams.get("google_calendar_connected") ?? undefined;
  const error = searchParams.get("google_calendar_error") ?? undefined;

  return <CalendarStatusBanner connected={connected} error={error} />;
}

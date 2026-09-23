import "server-only";

import { sendEmail } from "@/lib/email";
import type { ActionResult } from "@/types/action-result";

import { renderWeeklySummaryEmail } from "./email-template";
import { WeeklySummary } from "./types";

export async function sendWeeklySummaryEmail(summary: WeeklySummary): Promise<ActionResult> {
  return sendEmail({
    to: summary.email,
    subject: "Seu resumo da semana no Gerencie-se",
    html: renderWeeklySummaryEmail(summary),
  });
}

import "server-only";

import { sendEmail } from "@/lib/email";
import { renderWeeklySummaryEmail } from "./email-template";
import { WeeklySummary } from "./types";

export async function sendWeeklySummaryEmail(summary: WeeklySummary): Promise<{ error: string | null }> {
  return sendEmail({
    to: summary.email,
    subject: "Seu resumo da semana no Gerencie-se",
    html: renderWeeklySummaryEmail(summary),
  });
}

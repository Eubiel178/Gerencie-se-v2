import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/db/client";
import { userPreferences } from "@/db/schema";
import { getWeeklySummaryForUser } from "@/features/weekly-summary/get-weekly-summary-for-user";
import { sendWeeklySummaryEmail } from "@/features/weekly-summary/send-weekly-summary";
import { isValidCronSecret } from "@/lib/integrations/cron-auth";

/**
 * Disparo do resumo semanal pra todo mundo que ativou em Configurações —
 * pensado pra ser chamado por um agendador EXTERNO (ex.: Vercel Cron,
 * GitHub Actions, cron-job.org), já que este app roda localmente sem
 * scheduler próprio. Protegido por `CRON_SECRET`: sem essa variável
 * configurada, a rota sempre nega — nunca dispara e-mail de verdade sem
 * ninguém ter configurado isso de propósito (ver `docs/EMAIL_SETUP.md`
 * pra como testar o envio manualmente, sem depender desta rota).
 */
export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET não configurado — resumo semanal automático está desligado." },
      { status: 503 }
    );
  }

  const authHeader = request.headers.get("authorization") ?? "";
  if (!isValidCronSecret(authHeader, secret)) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const optedInUsers = await db
    .select({ userId: userPreferences.userId })
    .from(userPreferences)
    .where(eq(userPreferences.weeklySummaryEnabled, true));

  const results = await Promise.all(
    optedInUsers.map(async ({ userId }) => {
      const summary = await getWeeklySummaryForUser(userId);
      if (!summary) return { userId, sent: false, error: "Sem e-mail na conta." };

      const result = await sendWeeklySummaryEmail(summary);
      return { userId, sent: !result.error, error: result.error };
    })
  );

  return NextResponse.json({
    total: results.length,
    sent: results.filter((result) => result.sent).length,
    failed: results.filter((result) => !result.sent),
  });
}

import { WeeklySummary } from "./types";
import { renderSpamFolderHint } from "@/lib/email/template-hints";

// E-mail = HTML "old school": sem CSS externo, sem flexbox/grid (suporte
// inconsistente entre clientes) — tabela + estilo inline, mesma técnica
// usada por qualquer e-mail transacional de verdade. A cor de destaque
// (#0369a1) é a mesma de --color-highlight no app, só copiada aqui porque
// tokens CSS não chegam a um cliente de e-mail.
const HIGHLIGHT = "#0369a1";
const TEXT = "#1b1e24";
const MUTED = "#565f70";
const BORDER = "#d7dce4";

function statRow(label: string, value: string): string {
  return `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid ${BORDER};color:${MUTED};font-size:14px;">${label}</td>
      <td style="padding:10px 0;border-bottom:1px solid ${BORDER};color:${TEXT};font-size:16px;font-weight:600;text-align:right;">${value}</td>
    </tr>`;
}

export function renderWeeklySummaryEmail(summary: WeeklySummary): string {
  const greetingName = summary.name?.trim().split(/\s+/)[0] ?? "";
  const today = new Date();
  const sunday = new Date(today);
  sunday.setDate(today.getDate() - today.getDay());
  const dayFormatter = new Intl.DateTimeFormat("pt-BR", { day: "numeric" });
  const monthFormatter = new Intl.DateTimeFormat("pt-BR", { month: "short" });
  const startMonth = monthFormatter.format(sunday);
  const endMonth = monthFormatter.format(today);
  const period = startMonth === endMonth
    ? `De ${dayFormatter.format(sunday)} a ${dayFormatter.format(today)} de ${endMonth}`
    : `De ${dayFormatter.format(sunday)} de ${startMonth} a ${dayFormatter.format(today)} de ${endMonth}`;
  const insight = buildWeeklyInsight(summary);

  return `
<!DOCTYPE html>
<html lang="pt-BR">
  <body style="margin:0;padding:0;background:#f1f3f6;font-family:-apple-system,Segoe UI,Roboto,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid ${BORDER};">
            <tr>
              <td style="padding:28px 28px 4px;">
                <p style="margin:0;font-size:13px;letter-spacing:0.04em;text-transform:uppercase;color:${MUTED};">Gerencie-se</p>
                <h1 style="margin:8px 0 0;font-size:22px;color:${TEXT};">Seu resumo da semana${greetingName ? `, ${greetingName}` : ""}</h1>
                <p style="margin:8px 0 0;font-size:14px;line-height:1.45;color:${MUTED};">${period} · ${insight}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 28px 4px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  ${statRow("Tarefas concluídas", String(summary.tasksCompleted))}
                  ${statRow("Tarefas pendentes", String(summary.tasksPending))}
                  ${statRow("Tarefas atrasadas", String(summary.tasksOverdue))}
                  ${statRow("Horas de foco", `${summary.focusHours}h`)}
                  ${statRow("Hábitos registrados", `${summary.habitCompletionsThisWeek} em ${summary.activeHabits}`)}
                  ${statRow("Melhor sequência de hábito", `${summary.bestHabitStreak} dia(s)`)}
                  ${statRow("Progresso médio das metas", `${summary.avgGoalProgress}% em ${summary.activeGoals}`)}
                  ${statRow("Corrida", `${summary.runningKm} km`)}
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 28px 28px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f3f6;border-radius:10px;">
                  <tr>
                    <td style="padding:16px 20px;">
                      <p style="margin:0;font-size:13px;color:${MUTED};">Seu mascote: ${summary.mascotName} · nível ${summary.mascotLevel}</p>
                      <div style="margin-top:8px;height:8px;border-radius:999px;background:${BORDER};overflow:hidden;">
                        <div style="height:8px;width:${Math.round((summary.mascotXpIntoLevel / summary.mascotXpForNextLevel) * 100)}%;background:${HIGHLIGHT};"></div>
                      </div>
                      <p style="margin:8px 0 0;font-size:12px;color:${MUTED};">${summary.mascotXpIntoLevel} de ${summary.mascotXpForNextLevel} XP para o próximo nível</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:0 28px 28px;">
                <p style="margin:0;font-size:12px;color:${MUTED};">
                  Você recebeu este e-mail porque ativou o resumo semanal em Configurações. Pode desativar a qualquer momento por lá.
                </p>
                ${renderSpamFolderHint(MUTED)}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function buildWeeklyInsight(summary: WeeklySummary): string {
  if (summary.tasksCompleted > 0) {
    return `${summary.tasksCompleted} ${summary.tasksCompleted === 1 ? "tarefa concluída" : "tarefas concluídas"} nesta semana.`;
  }
  if (summary.habitCompletionsThisWeek > 0) return "Você manteve alguns hábitos em movimento.";
  if (summary.focusHours > 0) return "Você reservou tempo para se concentrar.";
  return "Ainda dá tempo de registrar uma pequena vitória.";
}

// Mesma técnica/paleta do resumo semanal (`weekly-summary/email-template.ts`)
// — tabela + estilo inline, cor de destaque copiada de --color-highlight
// porque tokens CSS não chegam a um cliente de e-mail.
const HIGHLIGHT = "#0369a1";
const TEXT = "#1b1e24";
const MUTED = "#565f70";
const BORDER = "#d7dce4";

export function renderTaskReminderEmail(taskTitle: string, label: string): string {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
  <body style="margin:0;padding:0;background:#f1f3f6;font-family:-apple-system,Segoe UI,Roboto,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid ${BORDER};">
            <tr>
              <td style="padding:28px 28px 20px;">
                <p style="margin:0;font-size:13px;letter-spacing:0.04em;text-transform:uppercase;color:${MUTED};">Gerencie-se · Lembrete</p>
                <h1 style="margin:8px 0 0;font-size:22px;color:${TEXT};">${taskTitle}</h1>
                <p style="margin:12px 0 0;display:inline-block;padding:6px 12px;border-radius:999px;background:${HIGHLIGHT};color:#ffffff;font-size:13px;font-weight:600;">${label}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 28px 28px;">
                <p style="margin:0;font-size:12px;color:${MUTED};">
                  Você recebeu este e-mail porque ativou lembretes de tarefa por e-mail em Configurações → Notificações. Pode desativar a qualquer momento por lá.
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
import { renderSpamFolderHint } from "@/lib/email/template-hints";

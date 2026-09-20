import { appUrl } from "@/lib/shared/app-url";
import { renderSpamFolderHint } from "@/lib/email/template-hints";

// Realinhado ao mesmo sistema visual dos outros e-mails transacionais
// (ver `src/lib/password-reset-email.ts`, `src/lib/login-alert-email.ts`,
// `src/features/weekly-summary/email-template.ts`) - antes era o único
// com layout via <div> (mais arriscado em clientes antigos, ver comentário
// abaixo) e paleta escura totalmente diferente (achado da auditoria
// pré-deploy: inconsistência visual entre os e-mails do produto).
// Tabela + estilo inline (sem CSS externo) - suporte mais confiável entre
// clientes de e-mail do que <div>/flexbox.
const TEXT = "#1b1e24";
const MUTED = "#565f70";
const BORDER = "#d7dce4";
const HIGHLIGHT = "#2d6cdf";

export function inviteEmailHtml(params: { inviterName: string; hasAccount: boolean }): string {
  const actionUrl = params.hasAccount
    ? `${appUrl()}/home/settings`
    : `${appUrl()}/register`;

  const actionLabel = params.hasAccount
    ? "Ver convite no Gerencie-se"
    : "Criar minha conta no Gerencie-se";

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
                <h1 style="margin:8px 0 0;font-size:22px;color:${TEXT};">Você foi convidado a colaborar</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 28px 4px;">
                <p style="margin:0;font-size:15px;line-height:1.5;color:${TEXT};">
                  <strong>${escapeHtml(params.inviterName)}</strong> te convidou para colaborar em tarefas,
                  rotina, hábitos e metas no Gerencie-se.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 28px;">
                <a href="${actionUrl}" style="display:inline-block;padding:12px 24px;border-radius:8px;background:${HIGHLIGHT};color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;">
                  ${actionLabel}
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding:0 28px 28px;">
                <p style="margin:0;font-size:12px;color:${MUTED};">
                  Se você não esperava este e-mail, pode ignorá-lo com segurança.
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

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

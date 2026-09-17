// Mesmo sistema visual dos outros e-mails transacionais (ver
// `password-reset-email.ts`, `login-alert-email.ts`) - tabela + estilo
// inline, sem CSS externo, mesma paleta.
const TEXT = "#1b1e24";
const MUTED = "#565f70";
const BORDER = "#d7dce4";
const HIGHLIGHT = "#2d6cdf";

export interface VerificationCodeEmailParams {
  code: string;
}

export function renderVerificationCodeEmail({ code }: VerificationCodeEmailParams): string {
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
                <h1 style="margin:8px 0 0;font-size:22px;color:${TEXT};">Confirme seu e-mail</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 28px 4px;">
                <p style="margin:0;font-size:15px;line-height:1.5;color:${TEXT};">
                  Use o código abaixo para confirmar seu e-mail e concluir seu cadastro no Gerencie-se.
                  Ele expira em 15 minutos.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 28px;">
                <p style="margin:0;padding:16px;border-radius:8px;background:#eef2fb;text-align:center;font-size:32px;font-weight:700;letter-spacing:0.3em;color:${HIGHLIGHT};">
                  ${code}
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 28px 28px;">
                <p style="margin:0;font-size:12px;color:${MUTED};">
                  Se você não pediu esse cadastro, pode ignorar este e-mail com segurança.
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
import { renderSpamFolderHint } from "@/lib/email-template-hints";

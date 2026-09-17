// Mesma técnica de e-mail "old school" de `login-alert-email.ts` (tabela +
// estilo inline, sem CSS externo).
const TEXT = "#1b1e24";
const MUTED = "#565f70";
const BORDER = "#d7dce4";
const HIGHLIGHT = "#2d6cdf";

export interface PasswordResetEmailParams {
  name: string | null;
  resetUrl: string;
}

export interface GoogleOnlyAccountEmailParams {
  name: string | null;
}

/** Enviado no lugar do e-mail de redefinição quando quem pediu não tem
 * senha própria (conta criada via "Continuar com Google") — a pessoa
 * ainda recebe uma resposta (não fica sem entender por que nada chegou),
 * mas sem link nenhum, já que não há senha pra redefinir. */
export function renderGoogleOnlyAccountEmail({ name }: GoogleOnlyAccountEmailParams): string {
  const greetingName = name?.trim().split(/\s+/)[0] ?? "";

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
                <h1 style="margin:8px 0 0;font-size:22px;color:${TEXT};">Sobre o pedido de redefinição de senha${greetingName ? `, ${greetingName}` : ""}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 28px 28px;">
                <p style="margin:0;font-size:15px;line-height:1.5;color:${TEXT};">
                  Sua conta no Gerencie-se foi criada com "Continuar com Google" e não tem uma senha
                  própria para redefinir. Para entrar, use o botão "Continuar com Google" na tela de login.
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

export function renderPasswordResetEmail({ name, resetUrl }: PasswordResetEmailParams): string {
  const greetingName = name?.trim().split(/\s+/)[0] ?? "";

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
                <h1 style="margin:8px 0 0;font-size:22px;color:${TEXT};">Redefinir sua senha${greetingName ? `, ${greetingName}` : ""}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 28px 4px;">
                <p style="margin:0;font-size:15px;line-height:1.5;color:${TEXT};">
                  Recebemos um pedido para redefinir a senha da sua conta. Clique no botão abaixo para
                  escolher uma nova senha. Este link expira em 1 hora.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 28px;">
                <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;border-radius:8px;background:${HIGHLIGHT};color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;">
                  Redefinir senha
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding:0 28px 28px;">
                <p style="margin:0;font-size:12px;color:${MUTED};">
                  Se você não pediu essa redefinição, pode ignorar este e-mail — sua senha continua a mesma.
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

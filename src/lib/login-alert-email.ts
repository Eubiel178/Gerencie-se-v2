// E-mail = HTML "old school": sem CSS externo, sem flexbox/grid (suporte
// inconsistente entre clientes) — tabela + estilo inline, mesma técnica
// usada em `src/features/weekly-summary/email-template.ts`. Cores
// copiadas dos tokens do app (não chegam a um cliente de e-mail).
const TEXT = "#1b1e24";
const MUTED = "#565f70";
const BORDER = "#d7dce4";
const DANGER = "#b91c1c";

export interface LoginAlertEmailParams {
  name: string | null;
}

export function renderLoginAlertEmail({ name }: LoginAlertEmailParams): string {
  const greetingName = name ? name.split(" ")[0] : "";

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
                <h1 style="margin:8px 0 0;font-size:22px;color:${TEXT};">Tentativas de entrar na sua conta${greetingName ? `, ${greetingName}` : ""}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 28px 4px;">
                <p style="margin:0;font-size:15px;line-height:1.5;color:${TEXT};">
                  Detectamos várias tentativas de login com senha errada na sua conta em um curto período.
                </p>
                <p style="margin:16px 0 0;font-size:15px;line-height:1.5;color:${TEXT};">
                  Se foi você tentando lembrar a senha, pode ignorar este e-mail — como as tentativas
                  falharam, ninguém entrou na sua conta e sua senha atual continua valendo.
                </p>
                <p style="margin:16px 0 0;font-size:15px;line-height:1.5;color:${DANGER};font-weight:600;">
                  Se não foi você, entre na sua conta com a senha atual e troque-a em
                  Configurações → Conta → Trocar senha.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 28px 28px;">
                <p style="margin:0;font-size:12px;color:${MUTED};">
                  Este é um aviso automático — o Gerencie-se nunca pede sua senha por e-mail.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

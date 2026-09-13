import { appUrl } from "@/lib/app-url";

/** HTML simples e inline (sem CSS externo) — e-mail é lido em clientes que
 * ignoram <style> em muitos casos, então cores/espaçamento vão direto no
 * atributo `style` de cada tag, com a paleta do produto hardcoded aqui de
 * propósito (um e-mail não carrega os design tokens da aplicação). */
export function inviteEmailHtml(params: { inviterName: string; hasAccount: boolean }): string {
  const actionUrl = params.hasAccount
    ? `${appUrl()}/home/settings`
    : `${appUrl()}/register`;

  const actionLabel = params.hasAccount
    ? "Ver convite no Gerencie-se"
    : "Criar minha conta no Gerencie-se";

  return `
    <div style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #f5f7fa;">
      <div style="background: #1f2233; border-radius: 16px; padding: 32px 24px; text-align: center;">
        <span style="font-size: 32px;">✦</span>
        <h1 style="color: #f4f5f7; font-size: 20px; margin: 16px 0 8px;">Gerencie-se</h1>
        <p style="color: #a4a7c1; font-size: 15px; line-height: 1.5; margin: 0 0 24px;">
          <strong style="color: #f4f5f7;">${escapeHtml(params.inviterName)}</strong> te convidou para
          colaborar em tarefas, rotina, hábitos e metas no Gerencie-se.
        </p>
        <a href="${actionUrl}" style="display: inline-block; background: #38bdf8; color: #051d2c; font-weight: 600; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-size: 14px;">
          ${actionLabel}
        </a>
      </div>
      <p style="color: #5b5f77; font-size: 12px; text-align: center; margin-top: 16px;">
        Se você não esperava este e-mail, pode ignorá-lo com segurança.
      </p>
    </div>
  `.trim();
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

import "server-only";

import { Resend } from "resend";

/**
 * Envio de e-mail transacional (convites de colaboração) via Resend
 * (resend.com) - plano grátis cobre folgadamente o volume de um app
 * pessoal (100 e-mails/dia). Chave nunca fica no cliente - só usada
 * aqui, dentro de Server Actions.
 *
 * Sem `RESEND_API_KEY` configurada, falha de forma clara e silenciosa
 * (nunca derruba o fluxo que chamou) - mesmo padrão do Google Agenda
 * quando as credenciais não estão configuradas ainda.
 */
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Domínio de teste do próprio Resend - funciona sem verificar domínio
// próprio, mas só entrega pro e-mail da conta que criou a chave de API.
// Para enviar convites pra qualquer e-mail (uso real, não só teste),
// verifique um domínio seu em resend.com/domains e troque este valor
// pelo remetente daquele domínio (ex.: "convites@seudominio.com").
const FROM_ADDRESS = "Gerencie-se <onboarding@resend.dev>";

export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(params: SendEmailParams): Promise<{ error: string | null }> {
  if (!resend) {
    return {
      error:
        "Envio de e-mail não configurado (RESEND_API_KEY ausente). Veja docs/EMAIL_SETUP.md.",
    };
  }

  try {
    const result = await resend.emails.send({
      from: FROM_ADDRESS,
      to: params.to,
      subject: params.subject,
      html: params.html,
    });

    if (result.error) {
      return { error: result.error.message };
    }

    return { error: null };
  } catch {
    return { error: "Não foi possível enviar o e-mail agora." };
  }
}

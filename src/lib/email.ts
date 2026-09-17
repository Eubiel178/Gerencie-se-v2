import "server-only";

import nodemailer from "nodemailer";

import { wasSmtpDeliveryAccepted } from "@/lib/smtp-delivery";

/**
 * Envio de e-mail transacional (convites, redefinição de senha, alerta
 * de login, resumo semanal) via SMTP do Gmail, usando uma conta comum
 * (`segerenciese@gmail.com`) + uma "Senha de app" — não um provedor de
 * e-mail transacional dedicado (Resend/SendGrid/etc). Escolhido de
 * propósito: qualquer provedor desses exige um domínio próprio
 * verificado pra entregar em qualquer destinatário (não só pro dono da
 * conta), e comprar um domínio não é gratuito. Usar a própria
 * infraestrutura do Gmail (que já é confiável o bastante pra outros
 * provedores não jogarem pra spam) resolve isso sem custo nenhum — a
 * troca é o remetente aparecer como um Gmail comum, não um endereço
 * "@seudominio.com" com marca própria.
 *
 * Sem `GMAIL_USER`/`GMAIL_APP_PASSWORD` configuradas, falha de forma
 * clara e silenciosa (nunca derruba o fluxo que chamou) — mesmo padrão
 * do Google Agenda quando as credenciais não estão configuradas ainda.
 */
const gmailUser = process.env.GMAIL_USER;
const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;

const transporter =
  gmailUser && gmailAppPassword
    ? nodemailer.createTransport({
        service: "gmail",
        auth: { user: gmailUser, pass: gmailAppPassword },
      })
    : null;

export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(
  params: SendEmailParams,
): Promise<{ error: string | null }> {
  if (!transporter || !gmailUser) {
    return {
      error:
        "Envio de e-mail não configurado (GMAIL_USER/GMAIL_APP_PASSWORD ausentes). Veja docs/EMAIL_SETUP.md.",
    };
  }

  try {
    const delivery = await transporter.sendMail({
      from: `Gerencie-se <${gmailUser}>`,
      to: params.to,
      subject: params.subject,
      html: params.html,
    });

    // `sendMail` pode resolver mesmo quando o servidor SMTP rejeita o
    // destinatário (a informação vem em `rejected`). Tratar qualquer
    // resolução como sucesso fazia o cadastro afirmar que enviou um código
    // que nunca sairia do servidor. "Aceito pelo SMTP" ainda não promete
    // entrega na caixa de entrada, mas é a confirmação confiável que este
    // transporte consegue oferecer.
    if (!wasSmtpDeliveryAccepted(delivery)) {
      return { error: "O servidor de e-mail não aceitou o destinatário." };
    }

    return { error: null };
  } catch {
    return { error: "Não foi possível enviar o e-mail agora." };
  }
}

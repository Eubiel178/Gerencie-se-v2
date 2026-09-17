/**
 * O Nodemailer considera a conversa SMTP concluída mesmo quando um ou mais
 * destinatários foram rejeitados. O chamador só pode dizer que enviou um
 * e-mail quando ao menos um destinatário foi aceito e nenhum foi rejeitado.
 */
export function wasSmtpDeliveryAccepted(delivery: {
  accepted: unknown[];
  rejected: unknown[];
}): boolean {
  return delivery.accepted.length > 0 && delivery.rejected.length === 0;
}

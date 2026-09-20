/** URL pública do app, usada para montar links absolutos dentro de
 * e-mails (convite de compartilhamento, redefinição de senha). */
export function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

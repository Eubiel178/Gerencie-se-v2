/** URL pública do app, usada para montar links absolutos dentro de
 * e-mails (convite de compartilhamento, redefinição de senha) e para
 * metadados de SEO (metadataBase, canonical, sitemap, JSON-LD).
 *
 * Prioridade:
 *  1. NEXT_PUBLIC_APP_URL  — definido manualmente (qualquer deployment)
 *  2. VERCEL_URL           — auto-definido pela Vercel em produção
 *  3. localhost:3000       — fallback apenas para desenvolvimento local
 */
export function appUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

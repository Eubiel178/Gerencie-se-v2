import "server-only";

import { eq } from "drizzle-orm";
import webpush from "web-push";

import { db } from "@/db/client";
import { pushSubscriptions } from "@/db/schema";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT ?? "mailto:segerenciese@gmail.com";

const isConfigured = !!VAPID_PUBLIC_KEY && !!VAPID_PRIVATE_KEY;

if (isConfigured) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY!, VAPID_PRIVATE_KEY!);
}

export interface PushPayload {
  title: string;
  body: string;
  // Usado como `tag` da notificação do navegador (agrupa/substitui
  // notificações relacionadas em vez de empilhar uma por uma) e também
  // repassado no clique, para abrir a tela certa do app.
  tag: string;
  url?: string;
}

/**
 * Manda uma notificação push para TODOS os navegadores/dispositivos em
 * que o usuário ativou (uma pessoa pode ter o celular e o PC inscritos
 * ao mesmo tempo). Sem VAPID configurado, é um no-op silencioso — mesma
 * filosofia de `CRON_SECRET` ausente em `send-weekly-summary.ts`: nunca
 * quebra o resto do app, só significa que o recurso está desligado.
 *
 * Uma inscrição que o navegador já descartou (usuário desinstalou,
 * revogou a permissão, etc.) responde 404/410 — apagamos ela do banco
 * nessa hora, em vez de tentar de novo pra sempre.
 */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<void> {
  if (!isConfigured) return;

  const subscriptions = await db
    .select()
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.userId, userId));

  await Promise.all(
    subscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: { p256dh: subscription.p256dh, auth: subscription.auth },
          },
          JSON.stringify(payload)
        );
      } catch (error) {
        const statusCode = (error as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, subscription.id));
        }
      }
    })
  );
}

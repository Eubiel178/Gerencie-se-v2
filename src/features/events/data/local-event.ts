import "server-only";

import { and, eq } from "drizzle-orm";

import * as domain from "@/features/events/domain";

import { db } from "@/db/client";
import { events } from "@/db/schema";
import { requireUserId } from "@/lib/require-user-id";

/**
 * Implementação local (Drizzle + Postgres) dos casos de uso de Event.
 *
 * Substitui a antiga `RemoteEvent` (Axios + json-server). Só pode ser usada
 * no servidor — depende do driver `postgres`, que não roda no browser. Por
 * isso ela é consumida exclusivamente pelas Server Actions em
 * `src/features/events/actions.ts` e pelo Server Component `Event`, nunca
 * diretamente por um Client Component.
 */
export class LocalEvent
  implements
    domain.CreateEvent,
    domain.LoadAllEvents,
    domain.UpdateEvent,
    domain.DeleteEvent
{
  async create(params: domain.CreateEvent.Params) {
    const userId = await requireUserId();
    const id = crypto.randomUUID();

    await db.insert(events).values({
      id,
      userId,
      title: params.title,
      description: params.description,
      start: params.start,
      end: params.end,
      url: params.url,
      backgroundColor: params.backgroundColor,
    });

    return { id };
  }

  async loadAll(): Promise<domain.LoadAllEvents.Model> {
    const userId = await requireUserId();

    const rows = await db
      .select()
      .from(events)
      .where(eq(events.userId, userId));

    return rows.map((row) => ({
      id: row.id,
      userId: row.userId,
      title: row.title,
      description: row.description,
      start: row.start,
      end: row.end ?? undefined,
      url: row.url ?? undefined,
      backgroundColor: row.backgroundColor ?? undefined,
    }));
  }

  async update(params: domain.UpdateEvent.Params) {
    const userId = await requireUserId();
    const { id, title, description, start, end, url, backgroundColor } =
      params;

    await db
      .update(events)
      .set({ title, description, start, end, url, backgroundColor })
      .where(and(eq(events.id, id), eq(events.userId, userId)));
  }

  async delete(params: domain.DeleteEvent.Params) {
    const userId = await requireUserId();

    await db
      .delete(events)
      .where(and(eq(events.id, params.id), eq(events.userId, userId)));
  }
}

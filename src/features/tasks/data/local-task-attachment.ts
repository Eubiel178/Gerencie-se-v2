import "server-only";

import { and, eq, or } from "drizzle-orm";

import * as domain from "@/features/tasks/domain";

import { db } from "@/db/client";
import { taskAttachments, tasks } from "@/db/schema";
import { requireUserId } from "@/lib/auth";
import { MAX_ATTACHMENT_SIZE_BYTES } from "@/lib/security/upload-limits";

const ATTACHMENT_METADATA_COLUMNS = {
  id: taskAttachments.id,
  taskId: taskAttachments.taskId,
  fileName: taskAttachments.fileName,
  mimeType: taskAttachments.mimeType,
  sizeBytes: taskAttachments.sizeBytes,
  createdAt: taskAttachments.createdAt,
} as const;

/**
 * Anexos de tarefa. Mesma regra de acesso de `LocalTask`: dono OU
 * colaborador (tarefa compartilhada) podem ver/enviar; só quem enviou o
 * anexo OU o dono da tarefa pode remover — compartilhamento dá acesso de
 * ajudar, nunca de apagar o que é do outro.
 */
export class LocalTaskAttachment
  implements
    domain.ListTaskAttachments,
    domain.AddTaskAttachment,
    domain.DeleteTaskAttachment,
    domain.GetTaskAttachmentContent
{
  async listAttachments(taskId: string): Promise<domain.ITaskAttachment[]> {
    const userId = await requireUserId();
    await assertTaskAccess(taskId, userId);

    return db.select(ATTACHMENT_METADATA_COLUMNS).from(taskAttachments).where(eq(taskAttachments.taskId, taskId));
  }

  async addAttachment(params: domain.AddTaskAttachmentParams): Promise<domain.ITaskAttachment> {
    const userId = await requireUserId();
    await assertTaskAccess(params.taskId, userId);

    // Nunca confia só na validação do cliente/da rota: reafirma o limite
    // aqui também, no ponto que efetivamente grava o arquivo.
    if (params.content.byteLength > MAX_ATTACHMENT_SIZE_BYTES) {
      throw new Error("Arquivo muito grande.");
    }

    const [row] = await db
      .insert(taskAttachments)
      .values({
        taskId: params.taskId,
        userId,
        fileName: params.fileName,
        mimeType: params.mimeType,
        sizeBytes: params.content.byteLength,
        content: params.content,
      })
      .returning(ATTACHMENT_METADATA_COLUMNS);

    return row;
  }

  async deleteAttachment(id: string): Promise<void> {
    const userId = await requireUserId();

    const [attachment] = await db
      .select({ taskId: taskAttachments.taskId, uploaderId: taskAttachments.userId })
      .from(taskAttachments)
      .where(eq(taskAttachments.id, id))
      .limit(1);

    if (!attachment) return;

    const [task] = await db
      .select({ userId: tasks.userId })
      .from(tasks)
      .where(eq(tasks.id, attachment.taskId))
      .limit(1);

    const canDelete = attachment.uploaderId === userId || task?.userId === userId;

    if (!canDelete) {
      throw new Error("Sem permissão para remover este anexo.");
    }

    await db.delete(taskAttachments).where(eq(taskAttachments.id, id));
  }

  async getAttachmentContent(id: string): Promise<domain.ITaskAttachmentContent | null> {
    const userId = await requireUserId();

    const [row] = await db.select().from(taskAttachments).where(eq(taskAttachments.id, id)).limit(1);
    if (!row) return null;

    await assertTaskAccess(row.taskId, userId);

    return row;
  }
}

async function assertTaskAccess(taskId: string, userId: string): Promise<void> {
  const [task] = await db
    .select({ id: tasks.id })
    .from(tasks)
    .where(and(eq(tasks.id, taskId), or(eq(tasks.userId, userId), eq(tasks.sharedWithUserId, userId))))
    .limit(1);

  if (!task) {
    throw new Error("Tarefa não encontrada.");
  }
}

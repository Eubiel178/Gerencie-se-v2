import "server-only";

import { z } from "zod";

import { ALL_COMPANION_MOVES } from "@/features/execution-companion/domain/companion-moves";

export const DecomposeTaskResponseSchema = z.object({
  steps: z.array(z.object({
    title: z.string(),
    completed: z.boolean().default(false),
  })).min(1).max(12),
  firstMessage: z.string().max(280),
});

export const StuckResponseSchema = z.object({
  suggestion: z.string().max(280),
});

export const ResumeResponseSchema = z.object({
  message: z.string().max(280),
});

/**
 * Uma interação espontânea do Companion na página de Tarefas, gerada
 * numa ÚNICA chamada - `written` e `spoken` SEMPRE nascem juntos, do
 * MESMO contexto, nunca de chamadas separadas. É isso que impede o
 * bug de "o balão mostra uma coisa enquanto o TTS fala outra": não
 * existe um caminho no código pra pedir só um dos dois.
 */
export const CompanionInteractionResponseSchema = z.object({
  written: z.string().min(1).max(160),
  spoken: z.string().min(1).max(220),
  // A IA ESCOLHE dentro do conjunto de movimentos elegíveis passado no
  // prompt (`eligibleMoves`) — nunca decide sozinha se algo é elegível
  // ou não. Quem chama (`resolveCompanionMessageAction`) ainda valida
  // que o valor devolvido pertence à lista elegível DESTA chamada
  // específica (o enum aqui só garante que é um movimento válido em
  // geral, não que era permitido agora).
  move: z.enum(ALL_COMPANION_MOVES as [string, ...string[]]),
});

export const IntentionResponseSchema = z.object({
  action: z.enum([
    "task.create",
    "task.complete",
    "task.update",
    "task.updateDueDate",
    "task.addStep",
    "task.startExecution",
  ]),
  params: z.record(z.unknown()),
  confidence: z.number().min(0).max(1),
});

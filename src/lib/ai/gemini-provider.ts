import "server-only";

import type { MascotPersonality } from "@/features/focus/domain/mascot";

import { generateJSON, isAIProviderAvailable, sanitizeUserContent } from "./gateway";
import {
  getDecomposePrompt,
  getStuckPrompt,
  getResumePrompt,
  getIntentionPrompt,
} from "./prompts/system-prompt";
import {
  DecomposeTaskResponseSchema,
  StuckResponseSchema,
  ResumeResponseSchema,
  IntentionResponseSchema,
} from "./schemas/assistant";

export class GeminiAssistantProvider {
  async decomposeTask(params: {
    taskTitle: string;
    taskDescription: string;
    existingSteps: string[];
    personality: MascotPersonality;
  }): Promise<{ steps: { title: string; completed: boolean }[]; firstMessage: string } | null> {
    if (!isAIProviderAvailable()) return null;

    const existingText = params.existingSteps.length > 0
      ? `\nPassos já existentes: ${params.existingSteps.join(", ")}\nTrabalhe sobre esses passos, não gere novos.`
      : "";

    const descText = params.taskDescription
      ? ` Descrição: ${params.taskDescription}`
      : "";

    const prompt = `A tarefa ${sanitizeUserContent(params.taskTitle)} precisa ser dividida em passos.${descText}${existingText}`;

    const result = await generateJSON({
      prompt,
      systemInstruction: getDecomposePrompt(params.personality),
      operation: "decompose_task",
    });

    if (!result) return null;

    try {
      const parsed = JSON.parse(result.text);
      const validated = DecomposeTaskResponseSchema.safeParse(parsed);
      if (validated.success) return validated.data;
    } catch {
      // invalid JSON
    }

    return null;
  }

  async helpWhenStuck(params: {
    taskTitle: string;
    currentStep: string;
    completedSteps: string[];
    personality: MascotPersonality;
  }): Promise<{ suggestion: string } | null> {
    if (!isAIProviderAvailable()) return null;

    const completedText = params.completedSteps.length > 0
      ? `\nPassos já feitos: ${params.completedSteps.join(", ")}`
      : "";

    const prompt = `O usuário está travado na tarefa ${sanitizeUserContent(params.taskTitle)}, passo atual: ${sanitizeUserContent(params.currentStep)}.${completedText}`;

    const result = await generateJSON({
      prompt,
      systemInstruction: getStuckPrompt(params.personality),
      operation: "help_when_stuck",
    });

    if (!result) return null;

    try {
      const parsed = JSON.parse(result.text);
      const validated = StuckResponseSchema.safeParse(parsed);
      if (validated.success) return validated.data;
    } catch {
      // invalid JSON
    }

    return null;
  }

  async resumeAfterDistraction(params: {
    taskTitle: string;
    currentStep: string;
    completedSteps: string[];
    personality: MascotPersonality;
  }): Promise<{ message: string } | null> {
    if (!isAIProviderAvailable()) return null;

    const completedText = params.completedSteps.length > 0
      ? `\nPassos já feitos: ${params.completedSteps.join(", ")}`
      : "";

    const prompt = `O usuário retornou após uma pausa. Estava fazendo a tarefa ${sanitizeUserContent(params.taskTitle)}, passo: ${sanitizeUserContent(params.currentStep)}.${completedText}`;

    const result = await generateJSON({
      prompt,
      systemInstruction: getResumePrompt(params.personality),
      operation: "resume_after_distraction",
    });

    if (!result) return null;

    try {
      const parsed = JSON.parse(result.text);
      const validated = ResumeResponseSchema.safeParse(parsed);
      if (validated.success) return validated.data;
    } catch {
      // invalid JSON
    }

    return null;
  }

  async interpretIntention(params: {
    message: string;
    personality: MascotPersonality;
  }): Promise<{
    action: string | null;
    params: Record<string, unknown>;
    confidence: number;
  } | null> {
    if (!isAIProviderAvailable()) return null;

    const result = await generateJSON({
      prompt: `Mensagem do usuário: ${sanitizeUserContent(params.message)}`,
      systemInstruction: getIntentionPrompt(params.personality),
      operation: "parse_action",
    });

    if (!result) return null;

    try {
      const parsed = JSON.parse(result.text);
      const validated = IntentionResponseSchema.safeParse(parsed);
      if (validated.success) return validated.data;
    } catch {
      // invalid JSON
    }

    return null;
  }
}

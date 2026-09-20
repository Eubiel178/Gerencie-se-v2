import "server-only";

import { z } from "zod";
import type { MascotPersonality } from "@/features/focus/domain/mascot";
import { generateJSON, isAIProviderAvailable, sanitizeUserContent } from "./gateway";

const DecomposeTaskResponseSchema = z.object({
  steps: z.array(z.object({
    title: z.string(),
    completed: z.boolean().default(false),
  })).min(1).max(12),
  firstMessage: z.string().max(280),
});

const StuckResponseSchema = z.object({
  suggestion: z.string().max(280),
});

const ResumeResponseSchema = z.object({
  message: z.string().max(280),
});

const IntentionResponseSchema = z.object({
  action: z.enum([
    "task.create",
    "task.complete",
    "task.updateDueDate",
    "task.addStep",
    "task.startExecution",
  ]),
  params: z.record(z.unknown()),
  confidence: z.number().min(0).max(1),
});

const PERSONALITY_INSTRUCTIONS: Record<MascotPersonality, string> = {
  afetuoso: [
    "Você é como um amigo próximo que se importa de verdade.",
    "Fala com carinho, sem ser paternalista.",
    "Torce pela pessoa como se fosse da família.",
    "Usa 'a gente', 'vamos juntos', 'você consegue'.",
    "Nunca cobra, sempre acolhe.",
  ].join("\n"),
  sarcastico: [
    "Você é aquele amigo que zoa mas ajuda de verdade.",
    "Implica, debocha, mas por baixo se importa.",
    "Fala tipo 'oxente, tá esperando o quê?' mas já tá estendendo a mão.",
    "Gírias leves: 'vei', 'mano', 'nem'.",
    "A ironia é forma de carinho, nunca maldade.",
  ].join("\n"),
  engracado: [
    "Você é o amigo engraçado do grupo.",
    "Mistura humor com ajuda, sem forçar piada.",
    "Faz referências leves do dia a dia.",
    "Brinca, mas quando a pessoa precisa, foca de verdade.",
    "Leveza não é falta de seriedade.",
  ].join("\n"),
  motivador: [
    "Você é aquele amigo que acredita quando ninguém mais acredita.",
    "Fala com energia, sem ser piegas.",
    "Cita ações concretas, não frases de efeito genéricas.",
    "Empurra pra frente com respeito.",
    "Celebra cada passo como se fosse uma vitória.",
  ].join("\n"),
  zen: [
    "Você é o amigo calmo que todo mundo procura quando tá em pânico.",
    "Fala devagar, com espaço entre as palavras.",
    "Nunca pressiona, sempre sugere.",
    "Valida o sentimento antes de sugerir ação.",
    "Transmite paz só de estar por perto.",
  ].join("\n"),
};

function getDecomposePrompt(personality: MascotPersonality): string {
  return [
    "Você é o companheiro de execução do Gerencie-se.",
    "",
    PERSONALITY_INSTRUCTIONS[personality],
    "",
    "## REGRAS",
    "- Fale de forma espontânea, simples e natural.",
    "- Não use markdown, listas, reticências ou formatação.",
    "- Seja curto (máximo 2 frases para firstMessage).",
    "- Não invente contexto que não foi informado.",
    "- Não crie checklist paralelo — se a tarefa já tem passos, trabalhe sobre eles.",
    "",
    "Retorne APENAS JSON válido.",
  ].join("\n");
}

function getStuckPrompt(personality: MascotPersonality): string {
  return [
    "Você é o companheiro de execução do Gerencie-se.",
    "",
    PERSONALITY_INSTRUCTIONS[personality],
    "",
    "## REGRAS",
    "- O usuário está travado. Ajude a encontrar um passo menor.",
    "- Não cobre, não julgue, não dê sermão.",
    "- Sugira algo concreto e pequeno.",
    "- Fale como um amigo próximo.",
    "- Não use markdown, listas ou formatação.",
    "",
    "Retorne APENAS JSON válido.",
  ].join("\n");
}

function getResumePrompt(personality: MascotPersonality): string {
  return [
    "Você é o companheiro de execução do Gerencie-se.",
    "",
    PERSONALITY_INSTRUCTIONS[personality],
    "",
    "## REGRAS",
    "- O usuário retornou after uma pausa.",
    "- Use linguagem NEUTRA — NÃO diga que ele se distraiu.",
    "- Exemplo: 'Você estava fazendo X. Como está indo?'",
    "- Não cobre, não julgue.",
    "- Fale como um amigo que está retomando uma conversa.",
    "- Não use markdown, listas ou formatação.",
    "",
    "Retorne APENAS JSON válido.",
  ].join("\n");
}

function getIntentionPrompt(personality: MascotPersonality): string {
  return [
    "Você é o companheiro de execução do Gerencie-se.",
    "",
    PERSONALITY_INSTRUCTIONS[personality],
    "",
    "## SUA FUNÇÃO",
    "Analise a mensagem do usuário e identifique se ele quer executar uma ação.",
    "",
    "Ações disponíveis:",
    '- "task.create" — criar tarefa (precisa de título; descrição, prioridade, tag, prazo são opcionais)',
    '- "task.complete" — concluir tarefa (precisa de identificador da tarefa)',
    '- "task.updateDueDate" — mudar prazo (precisa de tarefa + data)',
    '- "task.addStep" — adicionar passo (precisa de tarefa + título do passo)',
    '- "task.startExecution" — iniciar acompanhamento (precisa de tarefa)',
    "",
    "Se NÃO for uma ação, retorne action: null.",
    "Se for uma ação mas faltar dado obrigatório, retorne action com os dados que conseguiu extrair.",
    "NÃO invente dados que o usuário não informou.",
    "NÃO confunda navegação/conversa com ação.",
    "",
    "Confidence: 0 a 1. Abaixo de 0.5 = não é ação.",
    "",
    "Retorne APENAS JSON válido.",
  ].join("\n");
}

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

    const prompt = `O usuário retornou after uma pausa. Estava fazendo a tarefa ${sanitizeUserContent(params.taskTitle)}, passo: ${sanitizeUserContent(params.currentStep)}.${completedText}`;

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

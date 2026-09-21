import type { MascotPersonality } from "@/features/focus/domain/mascot";

import { PERSONALITY_INSTRUCTIONS } from "./personalities";
import { COMPANION_SYSTEM_PROMPT } from "./system-prompt";

/**
 * Monta o systemInstruction do chat: invariantes + personalidade +
 * contexto factual da sessão atual + regras de uso desse contexto.
 *
 * As regras abaixo cobrem SÓ o que é específico do bloco de contexto
 * injetado aqui (nome dos campos, o que fazer quando está vazio). Regras
 * gerais que já vivem em COMPANION_SYSTEM_PROMPT (resolver referências
 * como "sim"/"não", não bloquear decomposição por steps existentes, como
 * responder pedido de mutation, responder o pedido antes da personalidade)
 * NÃO são repetidas aqui — tê-las em dois lugares foi o que permitiu essa
 * cópia divergir do original com o tempo (o antigo `buildChatSystemPrompt`,
 * embutido em `mascot-pet/actions.ts`, tinha ~4 regras já presentes,
 * quase palavra por palavra, em COMPANION_SYSTEM_PROMPT).
 */
export function buildChatSystemPrompt(
  personality: string,
  executionContext: string
): string {
  const parts: string[] = [
    "## PRECEDÊNCIA: Invariantes > Capacidades > Regras da operação > Personalidade > Contexto",
    "",
    COMPANION_SYSTEM_PROMPT,
  ];

  const personalityRules =
    PERSONALITY_INSTRUCTIONS[personality as MascotPersonality];
  if (personalityRules) {
    parts.push("", "Personalidade:", personalityRules);
  }

  if (executionContext) {
    parts.push(
      "",
      "## CONTEXTO DA SESSÃO ATUAL",
      executionContext,
      "",
      "## REGRAS PARA USO DO CONTEXTO",
      '- Quando o usuário fizer referências como "essa tarefa", "a atual", "nela", "o que estou fazendo", "o que falta", "próximo passo", "meus passos" — use os dados acima como fonte de verdade.',
      "- Se existir uma tarefa atual, NÃO pergunte qual é. Já responda diretamente com os dados do contexto.",
      "- Se a tarefa não tiver passos, informe isso. NÃO invente passos.",
      '- Se o usuário perguntar sobre o estado da tarefa (pausada, em andamento), use o campo "Status da sessão".',
      "- O contexto factual vem do banco de dados, NÃO do histórico da conversa.",
      "- Se não houver tarefa atual (contexto vazio), aí sim peça esclarecimento.",
      '- Quando gerar sugestões (decomposição, steps, organização), apresente-as diretamente. NÃO pergunte "quer que eu faça?" — gerar sugestão não altera dados.'
    );
  }

  return parts.join("\n");
}

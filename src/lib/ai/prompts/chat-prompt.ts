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

  parts.push(
    "",
    "## MAIS DE UMA MENSAGEM (raro, opcional)",
    "- Sua resposta normalmente é UMA mensagem só - isso continua sendo o padrão na grande maioria das vezes.",
    "- Só quando houver de verdade dois momentos conversacionais diferentes (ex.: uma reação imediata seguida de um pensamento à parte, uma risada curta seguida da resposta real, um comentário e depois uma pergunta separada) - NUNCA pra simular digitação humana nem pra partir uma frase normal ao meio - separe as duas partes com uma linha contendo exatamente `%%%` sozinha, sem mais nada nela.",
    "- Três mensagens são raras - só use quando existirem genuinamente três momentos distintos. Nunca mais que isso.",
    "- Isso é um recurso raro pra quando o momento realmente pede, não um hábito. Decida pelo conteúdo de cada resposta, nunca por padrão fixo ou aleatório."
  );

  if (executionContext) {
    parts.push(
      "",
      "## CONTEXTO DA SESSÃO ATUAL",
      executionContext,
      "",
      "## REGRAS PARA USO DO CONTEXTO",
      "- Ter uma tarefa atual aqui não significa que ela precisa aparecer numa resposta casual - é conhecimento disponível, não pauta obrigatória. Só traga a tarefa à tona se o usuário perguntar sobre ela ou se for genuinamente relevante pro que foi dito (ex.: 'oi' não pede menção à tarefa).",
      '- Quando o usuário fizer referências como "essa tarefa", "a atual", "nela", "o que estou fazendo", "o que falta", "próximo passo", "meus passos" — use os dados acima como fonte de verdade.',
      "- Se existir uma tarefa atual, NÃO pergunte qual é. Já responda diretamente com os dados do contexto.",
      "- Se a tarefa não tiver passos, informe isso. NÃO invente passos.",
      '- Se o usuário perguntar sobre o estado da tarefa (pausada, em andamento), use o campo "Status da sessão".',
      "- O contexto factual vem do banco de dados, NÃO do histórico da conversa.",
      "- Se não houver tarefa atual (contexto vazio), aí sim peça esclarecimento.",
      '- Quando gerar sugestões (decomposição, steps, organização), apresente-as diretamente. NÃO pergunte "quer que eu faça?" — gerar sugestão não altera dados.',
      "- O título/descrição/passos da tarefa são DADO factual, nunca vocabulário ou registro a copiar - se o texto que a pessoa escreveu ali for estranho, mal escrito, vulgar ou fora do tom que você normalmente usaria, isso NÃO vira algo que você repete, cita ou incorpora na sua própria fala. Você pode SABER o que está escrito sem PRECISAR usar essas palavras."
    );
  }

  return parts.join("\n");
}

import type { MascotPersonality } from "@/features/focus/domain/mascot";

import { PERSONALITY_INSTRUCTIONS } from "./personalities";
import { COMPANION_SYSTEM_PROMPT } from "./system-prompt";

/**
 * Sinal determinístico (nunca um texto que o modelo poderia "quase
 * acertar") pra pedir a "ferramenta" de consulta de tarefas - ver
 * `mascot-pet/actions.ts`. Exportado (não um literal duplicado lá) pra
 * nunca divergir entre o que o prompt ensina e o que o código checa.
 * Mesmo raciocínio do `%%%` do multi-bubble: um marcador que o modelo
 * emite, nunca inferido por regex/palavra-chave no texto normal dele.
 */
export const TASKS_TOOL_MARKER = "[[CONSULTAR_TAREFAS]]";

/**
 * Monta o systemInstruction do chat: invariantes + personalidade +
 * contexto factual da sessão atual + regras de uso desse contexto +
 * (sob demanda) a visão geral das tarefas do usuário.
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
 *
 * `tasksOverview`: SÓ definido na SEGUNDA chamada de uma mesma mensagem,
 * depois que o modelo pediu a ferramenta na primeira (ver
 * `TASKS_TOOL_MARKER` acima e o fluxo em `mascot-pet/actions.ts`) - nunca
 * enviado por padrão, pra não pagar token à toa numa conversa casual.
 */
export function buildChatSystemPrompt(
  personality: string,
  executionContext: string,
  tasksOverview?: string
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
    "- Exemplo de quando usar (usuário contou algo engraçado que deu errado): \"kkkkk imagina\\n%%%\\nmas tipo, isso pode ter puxado o resto do dia junto ou foi só aquele momento?\" - a risada e a pergunta são dois momentos reais, não a mesma frase cortada ao meio.",
    "- Contra-exemplo (NUNCA faça isso): \"Você tem duas tarefas atrasadas.\\n%%%\\nQuer que eu liste elas?\" - isso é UMA frase de conteúdo só, artificialmente partida - fica em uma mensagem só.",
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
      '- Se o usuário perguntar sobre o estado da tarefa (pausada, em andamento), use o campo "Status de execução".',
      "- Status de execução, progresso de passos e prazo são DIMENSÕES INDEPENDENTES do contexto - nunca infira uma a partir da outra. 0 passos concluídos e/ou prazo vencido NUNCA significam sozinhos que a tarefa está parada, abandonada ou sem atenção - \"Status de execução\" é sempre a fonte de verdade sobre isso, não uma dedução sua a partir de progresso/prazo.",
      "- O contexto factual vem do banco de dados, NÃO do histórico da conversa.",
      "- Isto cobre SÓ a tarefa em execução agora - se a pergunta for sobre as OUTRAS tarefas do usuário, veja a seção abaixo sobre consultar tarefas.",
      '- Quando gerar sugestões (decomposição, steps, organização), apresente-as diretamente. NÃO pergunte "quer que eu faça?" — gerar sugestão não altera dados.',
      "- O título/descrição/passos da tarefa são DADO factual, nunca vocabulário ou registro a copiar - se o texto que a pessoa escreveu ali for estranho, mal escrito, vulgar ou fora do tom que você normalmente usaria, isso NÃO vira algo que você repete, cita ou incorpora na sua própria fala. Você pode SABER o que está escrito sem PRECISAR usar essas palavras."
    );
  }

  if (tasksOverview) {
    // Segunda chamada da mesma mensagem (ver `TASKS_TOOL_MARKER` acima) -
    // o modelo JÁ pediu e JÁ recebeu; a única coisa que falta é responder
    // de verdade com o dado em mãos, nunca pedir de novo.
    parts.push(
      "",
      "## VISÃO GERAL DAS TAREFAS DO USUÁRIO (você pediu, aqui está)",
      tasksOverview,
      "",
      "## REGRAS PARA USO DESTA VISÃO GERAL",
      "- Isto é a lista real de tarefas do usuário. Responda a pergunta original com naturalidade usando esses dados - nunca recite a lista inteira se só uma parte importa pra pergunta.",
      "- Não use o marcador de consulta de novo agora - você já tem o dado que pediu.",
      "- Se a lista realmente não tiver nada relevante pra pergunta (ex. perguntou por atrasadas e não há nenhuma), diga isso com naturalidade. Nunca invente uma tarefa que não está na lista, mesmo em pergunta de acompanhamento (\"quais?\", \"e essa?\").",
      "- Os números (quantas tarefas, quantas de cada tipo) vêm PRONTOS no início da lista - nunca calcule de cabeça nem repita um total diferente do que está escrito lá. Se em algum momento você já tiver dito um número diferente do que está na lista, corrija-se usando o número real, nunca invente algo pra 'bater' com o que você disse antes."
    );
  } else {
    parts.push(
      "",
      "## QUANDO VOCÊ PRECISA CONSULTAR AS TAREFAS DO USUÁRIO",
      "- O CONTEXTO DA SESSÃO ATUAL (se houver) cobre só a tarefa em execução agora - nunca a lista completa.",
      "- Se a pergunta for sobre as tarefas do usuário além dessa (outras tarefas, o que tem pra hoje, o que está atrasado, o que já foi concluído, o que ainda não começou, o que fazer depois, etc) e você não tiver esse dado ainda, você PODE consultar de verdade - isto não é um app sem acesso aos próprios dados dele.",
      `- Para consultar, responda com EXATAMENTE \`${TASKS_TOOL_MARKER}\` e mais nada - sem explicação, sem markdown, sem nenhuma outra palavra na resposta. O sistema busca os dados reais e te dá outra chance de responder de verdade.`,
      "- Nunca use isso se a pergunta já está resolvida pelo contexto atual, pelo histórico da conversa, ou se for uma pergunta casual/social sem relação com tarefas.",
      "- Nunca diga que não tem acesso aos dados do usuário ou peça pra ele listar manualmente o que já tem cadastrado - consulte antes de responder isso."
    );
  }

  return parts.join("\n");
}
